-- =============================================================================
-- Migration 012 — Strengthen Multi-Tenancy Store Isolation
-- Connects auth.users with stores via store_members table
-- Provides RLS policies so users only access data for their assigned stores
-- Safe to run multiple times (uses IF EXISTS / DROP before CREATE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. store_members table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_members (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON public.store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON public.store_members(store_id);

-- ---------------------------------------------------------------------------
-- 2. Backfill existing stores and users into store_members
-- Prevents lockout for existing deployments upon migration
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    INSERT INTO public.store_members (store_id, user_id, role)
    SELECT s.id, u.id, 'owner'
    FROM public.stores s
    CROSS JOIN auth.users u
    ON CONFLICT (store_id, user_id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Backfill legacy NULL store_id when deployment has single store
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  store_count int;
  single_store_id uuid;
BEGIN
  SELECT COUNT(*), MIN(id) INTO store_count, single_store_id FROM public.stores;
  -- If there is exactly one store, orphan records unambiguously belong to it
  IF store_count = 1 THEN
    UPDATE public.orders SET store_id = single_store_id WHERE store_id IS NULL;
    UPDATE public.products SET store_id = single_store_id WHERE store_id IS NULL;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_po') THEN
      UPDATE public.batch_po SET store_id = single_store_id WHERE store_id IS NULL;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Helper functions for store isolation (with search_path protection)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_store_member(lookup_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members sm
    WHERE sm.store_id = lookup_store_id
      AND sm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_store_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT sm.store_id FROM public.store_members sm
  WHERE sm.user_id = auth.uid();
$$;

-- Explicitly revoke public execution and grant only to authenticated role
REVOKE ALL ON FUNCTION public.is_store_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.user_store_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_store_ids() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Granular RLS for store_members (no privilege escalation or cross-store leaks)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated read store_members" ON public.store_members;
DROP POLICY IF EXISTS "Members view store_members" ON public.store_members;
CREATE POLICY "Members view store_members" ON public.store_members
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR public.is_store_member(store_id)
    )
  );

DROP POLICY IF EXISTS "Store owners manage members" ON public.store_members;
DROP POLICY IF EXISTS "Store owners insert members" ON public.store_members;
CREATE POLICY "Store owners insert members" ON public.store_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Store owners update members" ON public.store_members;
CREATE POLICY "Store owners update members" ON public.store_members
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Store owners delete members" ON public.store_members;
CREATE POLICY "Store owners delete members" ON public.store_members
  FOR DELETE USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Auto-assign store creator as owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_store_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner')
    ON CONFLICT (store_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_new_store_creator ON public.stores;
CREATE TRIGGER tr_new_store_creator
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_store_creator();

-- ---------------------------------------------------------------------------
-- 7. Strict Tenant-scoped RLS policies
-- ---------------------------------------------------------------------------

-- Orders
DROP POLICY IF EXISTS "Tenant scoped orders" ON public.orders;
CREATE POLICY "Tenant scoped orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      public.is_store_member(store_id)
      OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_store_member(store_id)
      OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
    )
  );

-- Products
DROP POLICY IF EXISTS "Tenant scoped products" ON public.products;
CREATE POLICY "Tenant scoped products" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      public.is_store_member(store_id)
      OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_store_member(store_id)
      OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
    )
  );

-- Batch PO (if module installed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_po') THEN
    DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;
    EXECUTE 'CREATE POLICY "Tenant scoped batch_po" ON public.batch_po
      FOR ALL USING (
        auth.role() = ''authenticated'' AND (
          public.is_store_member(store_id)
          OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
        )
      ) WITH CHECK (
        auth.role() = ''authenticated'' AND (
          public.is_store_member(store_id)
          OR (store_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.stores))
        )
      )';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Rollback Instructions (Down Migration reference):
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS tr_new_store_creator ON public.stores;
-- DROP FUNCTION IF EXISTS public.handle_new_store_creator();
-- DROP POLICY IF EXISTS "Tenant scoped orders" ON public.orders;
-- DROP POLICY IF EXISTS "Tenant scoped products" ON public.products;
-- DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;
-- DROP POLICY IF EXISTS "Store owners delete members" ON public.store_members;
-- DROP POLICY IF EXISTS "Store owners update members" ON public.store_members;
-- DROP POLICY IF EXISTS "Store owners insert members" ON public.store_members;
-- DROP POLICY IF EXISTS "Members view store_members" ON public.store_members;
-- DROP FUNCTION IF EXISTS public.user_store_ids();
-- DROP FUNCTION IF EXISTS public.is_store_member(uuid);
-- DROP TABLE IF EXISTS public.store_members;
