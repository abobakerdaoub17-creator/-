/*
# Fix trip inventory flow

- record_trip_sale: no longer touches warehouse inventory (stock was already deducted at load time)
- record_trip_return: restores returned qty to warehouse inventory
- Both functions require authenticated user, validate quantity, check trip is open
*/

DROP FUNCTION IF EXISTS public.record_trip_sale(uuid, integer);
DROP FUNCTION IF EXISTS public.record_trip_return(uuid, integer);

CREATE FUNCTION public.record_trip_sale(p_trip_item_id uuid, p_quantity integer)
RETURNS TABLE(
  sold_qty integer,
  remaining_qty integer,
  inventory_stock integer,
  trip_total_sales numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item trip_items%ROWTYPE;
  v_trip trips%ROWTYPE;
  v_available integer;
  v_amount numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100000 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_item FROM trip_items WHERE id = p_trip_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip item not found';
  END IF;

  SELECT * INTO v_trip FROM trips WHERE id = v_item.trip_id FOR UPDATE;
  IF NOT FOUND OR v_trip.status NOT IN ('loading', 'active') THEN
    RAISE EXCEPTION 'Trip is not open';
  END IF;

  v_available := v_item.loaded_qty - v_item.sold_qty - v_item.returned_qty;
  IF p_quantity > v_available THEN
    RAISE EXCEPTION 'Quantity exceeds trip stock';
  END IF;

  v_amount := p_quantity * v_item.unit_price;

  UPDATE trip_items
  SET sold_qty = sold_qty + p_quantity
  WHERE id = p_trip_item_id;

  UPDATE trips
  SET total_sales = total_sales + v_amount
  WHERE id = v_trip.id;

  RETURN QUERY
  SELECT v_item.sold_qty + p_quantity,
         v_available - p_quantity,
         NULL::integer,
         v_trip.total_sales + v_amount;
END;
$$;

CREATE FUNCTION public.record_trip_return(p_trip_item_id uuid, p_quantity integer)
RETURNS TABLE(
  returned_qty integer,
  remaining_qty integer,
  inventory_stock integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item trip_items%ROWTYPE;
  v_available integer;
  v_stock integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100000 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_item FROM trip_items WHERE id = p_trip_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip item not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM trips WHERE id = v_item.trip_id AND status IN ('loading', 'active')) THEN
    RAISE EXCEPTION 'Trip is not open';
  END IF;

  v_available := v_item.loaded_qty - v_item.sold_qty - v_item.returned_qty;
  IF p_quantity > v_available THEN
    RAISE EXCEPTION 'Quantity exceeds trip stock';
  END IF;

  UPDATE trip_items
  SET returned_qty = returned_qty + p_quantity
  WHERE id = p_trip_item_id;

  SELECT stock INTO v_stock FROM inventory WHERE id::text = v_item.item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  UPDATE inventory
  SET stock = stock + p_quantity
  WHERE id::text = v_item.item_id;

  RETURN QUERY
  SELECT v_item.returned_qty + p_quantity,
         v_available - p_quantity,
         v_stock + p_quantity;
END;
$$;

REVOKE ALL ON FUNCTION public.record_trip_sale(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_trip_sale(uuid, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.record_trip_return(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_trip_return(uuid, integer) TO authenticated;
