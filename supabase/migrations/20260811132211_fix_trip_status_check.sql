-- The app uses 'loading' and 'active' for open trips, but the RPC functions
-- were checking for a non-existent 'open' status, causing every sale/return
-- to fail with "Trip is not open". Fix both functions to accept the actual
-- open statuses used by the app.

CREATE OR REPLACE FUNCTION public.record_trip_sale(p_trip_item_id uuid, p_quantity integer)
RETURNS TABLE(trip_item_id uuid, sold_qty integer, remaining_qty integer, inventory_stock integer, trip_total_sales numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item trip_items%ROWTYPE;
  v_trip trips%ROWTYPE;
  v_stock integer;
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

  SELECT stock INTO v_stock FROM inventory WHERE id::text = v_item.item_id FOR UPDATE;
  IF NOT FOUND OR v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient warehouse stock';
  END IF;

  v_amount := p_quantity * v_item.unit_price;
  UPDATE trip_items
  SET sold_qty = sold_qty + p_quantity
  WHERE id = p_trip_item_id;

  UPDATE inventory
  SET stock = stock - p_quantity
  WHERE id::text = v_item.item_id;

  UPDATE trips
  SET total_sales = total_sales + v_amount
  WHERE id = v_trip.id;

  RETURN QUERY
  SELECT v_item.id, v_item.sold_qty + p_quantity, v_available - p_quantity,
         v_stock - p_quantity, v_trip.total_sales + v_amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_trip_return(p_trip_item_id uuid, p_quantity integer)
RETURNS TABLE(trip_item_id uuid, returned_qty integer, remaining_qty integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item trip_items%ROWTYPE;
  v_available integer;
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

  RETURN QUERY
  SELECT v_item.id, v_item.returned_qty + p_quantity, v_available - p_quantity;
END;
$function$;
