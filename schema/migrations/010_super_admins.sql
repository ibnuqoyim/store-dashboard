-- =============================================================================
-- Migration 010: Super admin support
-- Run after 009_store_invoice_prefix.sql
-- =============================================================================

-- Add super_admin_numbers column to bot_config.
-- Comma-separated phone numbers that have cross-store admin privileges
-- (create/update stores). Numbers here can also manage stores from the bot.
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS super_admin_numbers text NOT NULL DEFAULT '';
