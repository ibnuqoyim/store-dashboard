-- Add invoice_prefix to stores table
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS invoice_prefix TEXT;
