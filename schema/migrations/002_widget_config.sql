-- =============================================================================
-- Migration 002 — Add widget_config column to store_info
-- Run this on existing deployments to move dashboard layout from localStorage to DB.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- =============================================================================

ALTER TABLE public.store_info
  ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT NULL;
