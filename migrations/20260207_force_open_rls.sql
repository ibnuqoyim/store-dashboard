-- Force open RLS for critical tables to fix Update errors for good.
-- We explicitly drop known policies and then create a catch-all permissive policy.
-- This ensures 'orders/{id} not found' (404) errors are resolved.

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Orders" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for all users" ON orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON orders;

-- Create a single permissive policy
CREATE POLICY "Public Access Orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ORDER_ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Order Items" ON order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert for all users" ON order_items;
DROP POLICY IF EXISTS "Enable update for all users" ON order_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON order_items;

CREATE POLICY "Public Access Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- DELIVERIES
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Deliveries" ON deliveries;
DROP POLICY IF EXISTS "Enable read access for all users" ON deliveries;
DROP POLICY IF EXISTS "Enable insert for all users" ON deliveries;
DROP POLICY IF EXISTS "Enable update for all users" ON deliveries;
DROP POLICY IF EXISTS "Enable delete for all users" ON deliveries;

CREATE POLICY "Public Access Deliveries" ON deliveries FOR ALL USING (true) WITH CHECK (true);
