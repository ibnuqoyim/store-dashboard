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

CREATE POLICY "Public Access Batch PO" ON batch_po FOR ALL USING (true);

-- ---------------------------------------------------------------------------
-- Link orders → batch_po
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS po_id uuid REFERENCES batch_po(id) ON DELETE SET NULL;
