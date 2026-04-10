-- =============================================================================
-- modules/produksi.sql — Production run module
-- Prerequisites: core.sql + inventory.sql + resep.sql must be applied first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- production_runs
-- Tracks each baking/production session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_runs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) NOT NULL,

  -- How many recipe batches to produce in this run
  quantity_batches numeric NOT NULL DEFAULT 1 CHECK (quantity_batches > 0),

  date date NOT NULL,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed')),

  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access production_runs" ON production_runs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_production_runs_recipe_id ON production_runs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_production_runs_date ON production_runs(date);
CREATE INDEX IF NOT EXISTS idx_production_runs_status ON production_runs(status);

CREATE TRIGGER update_production_runs_updated_at
  BEFORE UPDATE ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Trigger: when a run is completed, auto-deduct inventory stock.
-- Inserts inventory_transactions (out) for each ingredient × batches.
-- The existing update_stock_after_transaction trigger in inventory.sql
-- handles the actual stock adjustment.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_production_completion()
RETURNS trigger AS $$
DECLARE
  run_label text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT name INTO run_label FROM recipes WHERE id = NEW.recipe_id;

    INSERT INTO inventory_transactions (
      inventory_id,
      transaction_type,
      quantity,
      notes,
      transaction_date
    )
    SELECT
      ri.inventory_id,
      'out',
      ri.quantity * NEW.quantity_batches,
      'Produksi: ' || run_label ||
        ' — ' || NEW.quantity_batches || ' batch @ ' || NEW.date,
      NOW()
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = NEW.recipe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_production_inventory_deduction
  AFTER UPDATE ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION handle_production_completion();
