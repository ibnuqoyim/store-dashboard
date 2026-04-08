-- =============================================================================
-- modules/adonan.sql — Dough management module (sourdough / bakery specific)
-- Prerequisites: schema/core.sql must be applied first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- adonan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adonan (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  weight numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE adonan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access adonan" ON adonan
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Link products → adonan
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS dough_id uuid REFERENCES adonan(id);
