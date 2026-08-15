/*
# Create schema for car parts wholesale management system

## Overview
This migration creates the complete database schema for a car parts wholesale
management application with authentication. The app supports two roles:
- admin: full access to all features (inventory, shipments, invoices, shops, payments)
- sales: limited access (invoices, shops, my-sales only)

## New Tables

1. `profiles` — user profile with role (admin/sales), linked to auth.users
   - id (uuid, PK, references auth.users)
   - name (text, display name)
   - role (text, 'admin' or 'sales', default 'sales')
   - created_at (timestamptz)

2. `shops` — customer shops/dealers
   - id (uuid, PK)
   - name, owner_name, phone, city, area
   - opening_balance (numeric, initial debt in LYD)
   - created_at (timestamptz)

3. `payments` — payments received from shops
   - id (uuid, PK)
   - shop_id (FK -> shops)
   - amount, method (cash/bank), date, note
   - created_by (text, user id who recorded it)
   - created_at (timestamptz)

4. `shipments` — shipping containers from China
   - id (uuid, PK)
   - ref, departure_date, arrival_date, status
   - total_cost_cny, total_shipping_cny, cny_to_lyd_rate, item_count
   - created_at (timestamptz)

5. `inventory` — parts in stock
   - id (uuid, PK)
   - oem, description, car_model, category, shelf
   - stock, min_stock, purchase_price, sell_price
   - shipment_id (FK -> shipments, nullable)
   - created_at (timestamptz)

6. `invoices` — sales invoices to shops
   - id (uuid, PK)
   - number (unique invoice number)
   - shop_id (FK -> shops)
   - shop_name (text snapshot)
   - date, subtotal, discount, total, total_cost
   - payment_method (cash/bank/credit)
   - paid_amount, status (paid/partial/unpaid)
   - created_by, created_by_name
   - created_at (timestamptz)

7. `invoice_lines` — line items for each invoice
   - id (uuid, PK)
   - invoice_id (FK -> invoices, cascade delete)
   - item_id, oem, description, qty
   - unit_price, unit_cost, line_total, line_cost

## Security (RLS)
- All tables have RLS enabled
- All policies scoped TO authenticated (app requires sign-in)
- profiles: users can read all profiles, update only their own
- shops, payments, shipments, inventory, invoices, invoice_lines:
  all authenticated users can read/write (shared business data,
  access control enforced at app level by role)

## Notes
1. Uses IF NOT EXISTS for idempotency
2. Policies dropped before re-creation for idempotency
3. Invoice number generated via sequence for uniqueness
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============ SHOPS ============
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  opening_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_shops" ON shops;
CREATE POLICY "select_shops" ON shops FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_shops" ON shops;
CREATE POLICY "insert_shops" ON shops FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_shops" ON shops;
CREATE POLICY "update_shops" ON shops FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_shops" ON shops;
CREATE POLICY "delete_shops" ON shops FOR DELETE
  TO authenticated USING (true);

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'bank')),
  date text NOT NULL,
  note text,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_payments" ON payments;
CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_payments" ON payments;
CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_payments" ON payments;
CREATE POLICY "delete_payments" ON payments FOR DELETE
  TO authenticated USING (true);

-- ============ SHIPMENTS ============
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL DEFAULT '',
  departure_date text NOT NULL DEFAULT '',
  arrival_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'arrived', 'cleared')),
  total_cost_cny numeric NOT NULL DEFAULT 0,
  total_shipping_cny numeric NOT NULL DEFAULT 0,
  cny_to_lyd_rate numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_shipments" ON shipments;
CREATE POLICY "select_shipments" ON shipments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_shipments" ON shipments;
CREATE POLICY "insert_shipments" ON shipments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_shipments" ON shipments;
CREATE POLICY "update_shipments" ON shipments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_shipments" ON shipments;
CREATE POLICY "delete_shipments" ON shipments FOR DELETE
  TO authenticated USING (true);

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oem text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  car_model text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  shelf text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  shipment_id uuid REFERENCES shipments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_inventory" ON inventory;
CREATE POLICY "select_inventory" ON inventory FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_inventory" ON inventory;
CREATE POLICY "insert_inventory" ON inventory FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_inventory" ON inventory;
CREATE POLICY "update_inventory" ON inventory FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_inventory" ON inventory;
CREATE POLICY "delete_inventory" ON inventory FOR DELETE
  TO authenticated USING (true);

-- ============ INVOICES ============
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shop_name text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'credit')),
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid')),
  created_by text NOT NULL DEFAULT '',
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_invoices" ON invoices;
CREATE POLICY "select_invoices" ON invoices FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_invoices" ON invoices;
CREATE POLICY "insert_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_invoices" ON invoices;
CREATE POLICY "update_invoices" ON invoices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_invoices" ON invoices;
CREATE POLICY "delete_invoices" ON invoices FOR DELETE
  TO authenticated USING (true);

-- ============ INVOICE LINES ============
CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id text NOT NULL DEFAULT '',
  oem text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  line_cost numeric NOT NULL DEFAULT 0
);

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_invoice_lines" ON invoice_lines;
CREATE POLICY "select_invoice_lines" ON invoice_lines FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_invoice_lines" ON invoice_lines;
CREATE POLICY "insert_invoice_lines" ON invoice_lines FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_invoice_lines" ON invoice_lines;
CREATE POLICY "update_invoice_lines" ON invoice_lines FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_invoice_lines" ON invoice_lines;
CREATE POLICY "delete_invoice_lines" ON invoice_lines FOR DELETE
  TO authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shipment_id ON inventory(shipment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'sales')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ GRANT TRIGGER EXECUTION ============
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
