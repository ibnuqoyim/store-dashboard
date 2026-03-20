-- =============================================================================
-- modules/inventory.sql — Raw material & packaging inventory module
-- Prerequisites: schema/core.sql must be applied first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('bahan_baku', 'packaging')),
  unit text NOT NULL, -- e.g. 'kg', 'pcs', 'liter', 'box'
  current_stock numeric NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock numeric NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  supplier text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);

-- ---------------------------------------------------------------------------
-- inventory_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('in', 'out')),
  quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reference text, -- e.g. invoice number or supplier name
  notes text,
  transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON inventory_transactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- ---------------------------------------------------------------------------
-- Trigger: keep inventory.updated_at current
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Trigger: adjust current_stock after each inventory_transaction
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS trigger AS $$
BEGIN
  IF new.transaction_type = 'in' THEN
    UPDATE inventory
    SET current_stock = current_stock + new.quantity
    WHERE id = new.inventory_id;
  ELSIF new.transaction_type = 'out' THEN
    UPDATE inventory
    SET current_stock = current_stock - new.quantity
    WHERE id = new.inventory_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_after_transaction
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- ---------------------------------------------------------------------------
-- Trigger: auto-insert expense record into financial_transactions for purchases
-- Requires: schema/core.sql (financial_transactions table) already applied.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_inventory_expense_transaction()
RETURNS trigger AS $$
BEGIN
  IF new.transaction_type = 'in' THEN
    DECLARE
      item_info record;
    BEGIN
      SELECT i.name, i.category
      INTO item_info
      FROM inventory i
      WHERE i.id = new.inventory_id;

      INSERT INTO financial_transactions (
        transaction_type,
        amount,
        description,
        transaction_date
      ) VALUES (
        'expense',
        new.total_cost,
        'Pembelian ' || item_info.category || ': ' || item_info.name ||
        CASE
          WHEN new.reference IS NOT NULL AND new.reference != ''
          THEN ' (' || new.reference || ')'
          ELSE ''
        END,
        new.transaction_date
      );
    END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_expense_transaction
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION insert_inventory_expense_transaction();
