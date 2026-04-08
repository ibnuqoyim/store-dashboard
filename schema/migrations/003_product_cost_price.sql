-- =============================================================================
-- 003_product_cost_price.sql
-- Adds cost_price column to products for COGS / HPP calculation in P&L report.
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT NULL;

COMMENT ON COLUMN products.cost_price IS
  'Harga pokok per unit (HPP). Used to compute COGS in the profit/loss report. NULL means HPP not set — the P&L report will flag these products.';
