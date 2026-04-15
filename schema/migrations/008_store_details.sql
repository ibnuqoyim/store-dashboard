-- =============================================================================
-- Migration 008: Add invoice/contact detail fields to stores table
-- These mirror the relevant fields from store_info but are per-store.
-- Run after 007_po_list.sql
-- =============================================================================

ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone               text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url            text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_name           text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account        text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_holder         text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS invoice_closing_message text DEFAULT 'Terima Kasih';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS invoice_closing_sub text;
