-- Migration: 20260916_batch_pos_integration.sql
-- Description: Wire Batch POS UI to the real orders/customers/products schema instead
-- of the standalone `batches` table introduced in 20260915 (which no other module reads).
-- Batch grouping continues to use the existing `batch_po` table (orders.po_id), already
-- shared by Orders, Dashboard and the Pre-Orders module.

-- 1. Payment & shipping details captured by the Batch POS checkout form
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'Ambil Sendiri',
ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pay_status text DEFAULT 'UNPAID' CHECK (pay_status IN ('PAID', 'DP', 'UNPAID')),
ADD COLUMN IF NOT EXISTS pay_method text CHECK (pay_method IN ('QRIS', 'Transfer BCA', 'Cash')),
ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'IN PREP', 'READY'));

CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);

-- 2. Track whether an order line used a manually overridden price (Batch POS inline pricing)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS is_custom_price boolean DEFAULT false;
