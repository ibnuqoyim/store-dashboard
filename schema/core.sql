-- =============================================================================
-- core.sql — Required for every business type
-- Apply this first in the Supabase SQL Editor before any module files.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extension
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- store_info
-- Consolidated from:
--   migrations/20260318_create_store_info.sql
--   migrations/20260320_extend_store_info.sql
--   migrations/20260320_add_modules_enabled.sql
--   migrations/20260320_add_branding.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,

  -- Core identity
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  opening_hours text NOT NULL,

  -- Maps
  maps_url text,
  maps_embed_url text,

  -- Hero section
  hero_kicker text,
  hero_title text,
  hero_tagline text,
  hero_description text,
  hero_images text[] NOT NULL DEFAULT '{}',
  hero_stats jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Tagline / why-us section
  tagline_heading text,
  tagline_subheading text,
  tagline_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tagline_quote text,

  -- Contact section
  contact_instagram_handle text,
  contact_instagram_url text,
  contact_whatsapp_number text,
  contact_whatsapp_url text,
  contact_email text,

  -- Banking & invoice
  bank_name text DEFAULT '',
  bank_account text DEFAULT '',
  bank_holder text DEFAULT '',
  invoice_closing_message text DEFAULT 'Terima Kasih',
  invoice_closing_sub text DEFAULT '',
  whatsapp_greeting_template text DEFAULT '',

  -- Locale
  currency text NOT NULL DEFAULT 'IDR',
  locale text NOT NULL DEFAULT 'id-ID',

  -- Module control
  modules_enabled text[] DEFAULT '{}',

  -- Branding
  primary_color text DEFAULT '#6366f1',
  logo_url text DEFAULT '',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON public.store_info
  FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- products
-- (dough_id is adonan-specific — see schema/modules/adonan.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  weight numeric,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Products" ON products FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  phone text,
  address text,
  total_purchases numeric DEFAULT 0,
  default_courier text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- orders
-- (po_id is batch-po-specific — see schema/modules/batch-po.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  date date NOT NULL,
  due_date date,
  customer_name text NOT NULL,
  customer_id uuid REFERENCES customers(id),
  phone text,
  status text DEFAULT 'pending', -- 'pending', 'paid'
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Orders" ON orders FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price numeric NOT NULL, -- snapshot price at time of order
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  courier_name text,
  shipping_cost numeric NOT NULL,
  address text,
  status text DEFAULT 'pending', -- 'pending', 'shipped', 'delivered'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Deliveries" ON deliveries FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- shipping_rates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_name text NOT NULL,
  description text,
  cost numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Shipping Rates" ON shipping_rates FOR ALL USING (true);

-- ---------------------------------------------------------------------------
-- financial_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON financial_transactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id ON financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

-- Trigger: auto-insert income record when an order is marked paid
CREATE OR REPLACE FUNCTION insert_financial_transaction()
RETURNS trigger AS $$
BEGIN
  IF new.status = 'paid' AND old.status != 'paid' THEN
    DECLARE
      total_amount numeric;
    BEGIN
      SELECT COALESCE(SUM(oi.quantity * oi.price), 0) + COALESCE(SUM(d.shipping_cost), 0)
      INTO total_amount
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN deliveries d   ON o.id = d.order_id
      WHERE o.id = new.id;

      INSERT INTO financial_transactions (
        order_id,
        transaction_type,
        amount,
        description,
        transaction_date
      ) VALUES (
        new.id,
        'income',
        total_amount,
        'Pembayaran Order ' || new.invoice_number || ' - ' || new.customer_name,
        new.created_at
      );
    END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_financial_transaction
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION insert_financial_transaction();

-- ---------------------------------------------------------------------------
-- operational_expenses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operational_expenses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  expense_date date NOT NULL,
  payment_method text,
  receipt_number text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON operational_expenses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_operational_expenses_category ON operational_expenses(category);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_date ON operational_expenses(expense_date);

-- Trigger: auto-insert expense record into financial_transactions
CREATE OR REPLACE FUNCTION insert_expense_transaction()
RETURNS trigger AS $$
BEGIN
  INSERT INTO financial_transactions (
    transaction_type,
    amount,
    description,
    transaction_date
  ) VALUES (
    'expense',
    new.amount,
    'Pengeluaran ' || new.category || ': ' || COALESCE(new.description, ''),
    new.expense_date::timestamp with time zone
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_transaction
  AFTER INSERT ON operational_expenses
  FOR EACH ROW
  EXECUTE FUNCTION insert_expense_transaction();
