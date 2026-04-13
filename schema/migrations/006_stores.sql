-- =============================================================================
-- Migration 006: Multi-store support
-- Run in Supabase SQL Editor AFTER all previous migrations.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- stores — branches / locations of the business
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access stores" ON stores
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Add store_id FK to products, orders, batch_po, bot_config
-- ---------------------------------------------------------------------------
ALTER TABLE products  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE orders    ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE batch_po  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- batch_po: Replace global UNIQUE(name) with per-store unique
-- Old constraint enforced globally; now each store can have its own batch names.
-- ---------------------------------------------------------------------------
ALTER TABLE batch_po DROP CONSTRAINT IF EXISTS batch_po_name_key;

-- Unique batch name within each store
CREATE UNIQUE INDEX IF NOT EXISTS batch_po_name_store_unique
  ON batch_po (name, store_id)
  WHERE store_id IS NOT NULL;

-- Keep global uniqueness for ungrouped batches (store_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS batch_po_name_null_store_unique
  ON batch_po (name)
  WHERE store_id IS NULL;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_store_id  ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id    ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_batch_po_store_id  ON batch_po(store_id);
