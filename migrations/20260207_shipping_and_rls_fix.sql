
-- Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_name TEXT NOT NULL,
  description TEXT,
  cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Create Policies for shipping_rates (Allow all for simplicity as requested, or auth based)
CREATE POLICY "Public Access Shipping Rates" ON shipping_rates FOR ALL USING (true);


-- FIX for "Order Update Not Found"
-- The issue is likely that the default RLS (deny all) or partial policies are active.
-- We will apply a broad policy for now to ensure functionality, as per earlier "allow_public_access" usage.

-- Drop existing policies to avoid conflicts (optional/safe way)
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for all users" ON orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON orders;

-- Re-apply full public access for ORDERS
DROP POLICY IF EXISTS "Public Access Orders" ON orders;
CREATE POLICY "Public Access Orders" ON orders FOR ALL USING (true);

-- Re-apply full public access for ORDER_ITEMS
DROP POLICY IF EXISTS "Public Access Order Items" ON order_items;
CREATE POLICY "Public Access Order Items" ON order_items FOR ALL USING (true);

-- Re-apply full public access for DELIVERIES
DROP POLICY IF EXISTS "Public Access Deliveries" ON deliveries;
CREATE POLICY "Public Access Deliveries" ON deliveries FOR ALL USING (true);

-- Re-apply full public access for PRODUCTS and ADONAN
DROP POLICY IF EXISTS "Public Access Products" ON products;
CREATE POLICY "Public Access Products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Adonan" ON adonan;
CREATE POLICY "Public Access Adonan" ON adonan FOR ALL USING (true);

