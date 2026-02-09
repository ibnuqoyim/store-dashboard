-- Add customer_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Seed customer_id from existing customers based on name
UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_name = c.name;

-- Optional: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
