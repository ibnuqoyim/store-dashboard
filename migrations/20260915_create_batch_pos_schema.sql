-- Migration: 20260915_create_batch_pos_schema.sql
-- Description: Add Batches table and Batch POS columns to orders and order_items

-- 1. Create Batches Table (if not exists)
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    production_date DATE NOT NULL,
    capacity_target INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'IN PRODUCTION', -- 'PLANNING', 'IN PRODUCTION', 'COMPLETED', 'CLOSED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add columns to Orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(50) REFERENCES batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30) NULL,
ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(30) DEFAULT 'Ambil Sendiri', -- 'Ahsan', 'TIKI', 'COD', 'Ambil Sendiri'
ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(12,2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON orders(batch_id);

-- 3. Add custom price tracking columns to Order Items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Transaction price (can be inline custom price)
ADD COLUMN IF NOT EXISTS is_custom_price BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_price_note VARCHAR(255) NULL;
