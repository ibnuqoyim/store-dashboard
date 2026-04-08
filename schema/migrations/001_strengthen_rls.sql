-- =============================================================================
-- Migration 001 — Strengthen Row Level Security
-- Run this on existing deployments that applied core.sql before this change.
-- Safe to run multiple times (uses IF EXISTS / DROP before CREATE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- store_info
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public access" ON public.store_info;
CREATE POLICY "Authenticated access store_info" ON public.store_info
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Products" ON public.products;
CREATE POLICY "Authenticated access products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Orders" ON public.orders;
CREATE POLICY "Authenticated access orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Order Items" ON public.order_items;
CREATE POLICY "Authenticated access order_items" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- deliveries
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Deliveries" ON public.deliveries;
CREATE POLICY "Authenticated access deliveries" ON public.deliveries
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- shipping_rates
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Shipping Rates" ON public.shipping_rates;
CREATE POLICY "Authenticated access shipping_rates" ON public.shipping_rates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- adonan (if module is installed)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adonan') THEN
    DROP POLICY IF EXISTS "Public Access Adonan" ON public.adonan;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'adonan' AND policyname = 'Authenticated access adonan'
    ) THEN
      EXECUTE 'CREATE POLICY "Authenticated access adonan" ON public.adonan
        FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- batch_po (if module is installed)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_po') THEN
    DROP POLICY IF EXISTS "Public Access Batch PO" ON public.batch_po;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'batch_po' AND policyname = 'Authenticated access batch_po'
    ) THEN
      EXECUTE 'CREATE POLICY "Authenticated access batch_po" ON public.batch_po
        FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- testimonials (if module is installed)
-- Split: public SELECT, authenticated write
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonials') THEN
    DROP POLICY IF EXISTS "Allow public access" ON public.testimonials;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'testimonials' AND policyname = 'Public read testimonials'
    ) THEN
      EXECUTE 'CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'testimonials' AND policyname = 'Authenticated modify testimonials'
    ) THEN
      EXECUTE 'CREATE POLICY "Authenticated modify testimonials" ON public.testimonials
        FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
  END IF;
END $$;
