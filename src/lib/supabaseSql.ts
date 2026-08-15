export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- كود إعداد وإصلاح أذونات وجداول Supabase لنظام قطع الغيار
-- قم بنسخ هذا الكود ولصقه في Supabase -> SQL Editor ثم اضغط Run
-- ==========================================================

-- 1. تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. إنشاء الجداول في حال عدم وجودها
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  city TEXT,
  area TEXT,
  opening_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL,
  departure_date TEXT,
  arrival_date TEXT,
  status TEXT DEFAULT 'in_transit',
  total_cost_cny NUMERIC DEFAULT 0,
  total_shipping_cny NUMERIC DEFAULT 0,
  cny_to_lyd_rate NUMERIC DEFAULT 1,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oem TEXT NOT NULL,
  description TEXT NOT NULL,
  car_model TEXT,
  category TEXT,
  shelf TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  purchase_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT,
  type TEXT,
  model TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  departure_at TEXT,
  return_at TEXT,
  status TEXT DEFAULT 'active',
  total_sales NUMERIC DEFAULT 0,
  city TEXT,
  area TEXT,
  notes TEXT,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  oem TEXT NOT NULL,
  description TEXT NOT NULL,
  loaded_qty INTEGER DEFAULT 0,
  sold_qty INTEGER DEFAULT 0,
  returned_qty INTEGER DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  shop_id TEXT,
  shop_name TEXT,
  date TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'paid',
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id TEXT,
  oem TEXT,
  description TEXT,
  qty INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  line_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT,
  amount NUMERIC DEFAULT 0,
  method TEXT DEFAULT 'cash',
  date TEXT,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT,
  oem TEXT,
  description TEXT,
  type TEXT NOT NULL,
  qty NUMERIC DEFAULT 0,
  source TEXT,
  target TEXT,
  vehicle_id TEXT,
  vehicle_name TEXT,
  trip_id TEXT,
  invoice_id TEXT,
  invoice_number TEXT,
  shop_id TEXT,
  shop_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  created_by_name TEXT
);

-- 3. حل مشكلة أذونات RLS (Row-Level Security)
-- السماح لجميع العمليات (قراءة، إضافة، تعديل، حذف)
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trip_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements DISABLE ROW LEVEL SECURITY;

-- في حال رغبت بتفعيل RLS مع سياسات مفتوحة للـ anon و authenticated:
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'shops', 'inventory', 'vehicles', 
    'trips', 'trip_items', 'invoices', 'invoice_lines', 
    'payments', 'shipments', 'stock_movements'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow All Public" ON %I;', t);
    EXECUTE format('CREATE POLICY "Allow All Public" ON %I FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;
`;
