-- =============================================================================
-- Migration 007: po_list — products opened per batch PO
-- Run after 006_stores.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS po_list (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id      uuid REFERENCES batch_po(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (po_id, product_id)
);

ALTER TABLE po_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access po_list" ON po_list
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_po_list_po_id      ON po_list(po_id);
CREATE INDEX IF NOT EXISTS idx_po_list_product_id ON po_list(product_id);
