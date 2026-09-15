-- =============================================================================
-- modules/batch-po.sql — Pre-order batch management module
-- Prerequisites: schema/core.sql must be applied first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- batch_po
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batch_po (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE batch_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access batch_po" ON batch_po
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Link orders → batch_po
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS po_id uuid REFERENCES batch_po(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Batch POS checkout fields (see migrations/20260916_batch_pos_integration.sql)
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'Ambil Sendiri',
  ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pay_status text DEFAULT 'UNPAID' CHECK (pay_status IN ('PAID', 'DP', 'UNPAID')),
  ADD COLUMN IF NOT EXISTS pay_method text CHECK (pay_method IN ('QRIS', 'Transfer BCA', 'Cash')),
  ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'IN PREP', 'READY'));

CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_custom_price boolean DEFAULT false;
