-- =============================================================================
-- 004_resep_produksi.sql
-- Adds recipe & production run tables for existing deployments.
-- Run this in the Supabase SQL Editor AFTER core.sql and inventory.sql.
-- Safe to run multiple times.
-- =============================================================================

-- Shared trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  yield_quantity numeric NOT NULL DEFAULT 1 CHECK (yield_quantity > 0),
  yield_unit text NOT NULL DEFAULT 'pcs',
  labor_cost_per_batch numeric NOT NULL DEFAULT 0 CHECK (labor_cost_per_batch >= 0),
  overhead_cost_per_batch numeric NOT NULL DEFAULT 0 CHECK (overhead_cost_per_batch >= 0),
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Authenticated access recipes') THEN
    CREATE POLICY "Authenticated access recipes" ON recipes
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recipes_updated_at') THEN
    CREATE TRIGGER update_recipes_updated_at
      BEFORE UPDATE ON recipes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES inventory(id) ON DELETE RESTRICT NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  notes text
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipe_ingredients' AND policyname = 'Authenticated access recipe_ingredients') THEN
    CREATE POLICY "Authenticated access recipe_ingredients" ON recipe_ingredients
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_inventory_id ON recipe_ingredients(inventory_id);

-- production_runs
CREATE TABLE IF NOT EXISTS production_runs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) NOT NULL,
  quantity_batches numeric NOT NULL DEFAULT 1 CHECK (quantity_batches > 0),
  date date NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_runs' AND policyname = 'Authenticated access production_runs') THEN
    CREATE POLICY "Authenticated access production_runs" ON production_runs
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_production_runs_recipe_id ON production_runs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_production_runs_date ON production_runs(date);
CREATE INDEX IF NOT EXISTS idx_production_runs_status ON production_runs(status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_production_runs_updated_at') THEN
    CREATE TRIGGER update_production_runs_updated_at
      BEFORE UPDATE ON production_runs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger: deduct inventory on completion
CREATE OR REPLACE FUNCTION handle_production_completion()
RETURNS trigger AS $$
DECLARE
  run_label text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT name INTO run_label FROM recipes WHERE id = NEW.recipe_id;
    INSERT INTO inventory_transactions (
      inventory_id, transaction_type, quantity, notes, transaction_date
    )
    SELECT
      ri.inventory_id,
      'out',
      ri.quantity * NEW.quantity_batches,
      'Produksi: ' || run_label || ' — ' || NEW.quantity_batches || ' batch @ ' || NEW.date,
      NOW()
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = NEW.recipe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_production_inventory_deduction') THEN
    CREATE TRIGGER trigger_production_inventory_deduction
      AFTER UPDATE ON production_runs
      FOR EACH ROW EXECUTE FUNCTION handle_production_completion();
  END IF;
END $$;

-- cost_price on products (from migration 003 — safe to re-run)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT NULL;
