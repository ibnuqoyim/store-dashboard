-- Migration: Add product code column
-- Run this in Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS code TEXT;

-- Optional: add unique constraint (uncomment if you want codes to be unique)
-- CREATE UNIQUE INDEX IF NOT EXISTS products_code_unique ON products (code) WHERE code IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN products.code IS 'Short code for bot commands, e.g. "SD", "CR". Used in /order and /update tambah commands.';
