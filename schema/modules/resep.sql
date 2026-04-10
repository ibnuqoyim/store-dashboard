-- =============================================================================
-- modules/resep.sql — Recipe & HPP calculator module
-- Prerequisites: core.sql + inventory.sql must be applied first.
-- =============================================================================

-- Shared trigger function (idempotent — safe to redefine)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- recipes
-- One recipe per product (or standalone). Defines the HPP cost structure.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,

  -- Yield: how many sellable units this recipe produces per batch
  yield_quantity numeric NOT NULL DEFAULT 1 CHECK (yield_quantity > 0),
  yield_unit text NOT NULL DEFAULT 'pcs',  -- e.g. 'loaf', 'pcs', 'box'

  -- Non-material costs per batch
  labor_cost_per_batch numeric NOT NULL DEFAULT 0 CHECK (labor_cost_per_batch >= 0),
  overhead_cost_per_batch numeric NOT NULL DEFAULT 0 CHECK (overhead_cost_per_batch >= 0),

  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access recipes" ON recipes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(product_id);

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- Each row = one raw material used in a recipe.
-- quantity is expressed in the same unit as inventory.unit.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES inventory(id) ON DELETE RESTRICT NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),  -- in inventory.unit
  notes text
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access recipe_ingredients" ON recipe_ingredients
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_inventory_id ON recipe_ingredients(inventory_id);
