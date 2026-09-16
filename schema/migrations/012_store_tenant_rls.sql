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
-- 2. Backfill primary user as owner for unassigned existing stores
-- Prevents lockout while avoiding cross-user leaks in multi-user environments
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  primary_user_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    SELECT id INTO primary_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF primary_user_id IS NOT NULL THEN
      INSERT INTO public.store_members (store_id, user_id, role)
      SELECT s.id, primary_user_id, 'owner'
      FROM public.stores s
      WHERE NOT EXISTS (
        SELECT 1 FROM public.store_members sm WHERE sm.store_id = s.id
      )
      ON CONFLICT (store_id, user_id) DO NOTHING;
    END IF;
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

CREATE OR REPLACE FUNCTION public.is_store_admin(lookup_store_id uuid)
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
      AND sm.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_owner(lookup_store_id uuid)
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
      AND sm.role = 'owner'
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

REVOKE ALL ON FUNCTION public.is_store_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_store_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.user_store_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_store_ids() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Granular RLS for store_members (evaluated via security definer helpers)
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
-- Only store owners or admins can insert new members (evaluated via helper function)
CREATE POLICY "Store owners insert members" ON public.store_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND public.is_store_admin(store_members.store_id)
  );

DROP POLICY IF EXISTS "Store owners update members" ON public.store_members;
CREATE POLICY "Store owners update members" ON public.store_members
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND public.is_store_owner(store_members.store_id)
  ) WITH CHECK (
    auth.role() = 'authenticated' AND public.is_store_owner(store_members.store_id)
  );

DROP POLICY IF EXISTS "Store owners delete members" ON public.store_members;
CREATE POLICY "Store owners delete members" ON public.store_members
  FOR DELETE USING (
    auth.role() = 'authenticated' AND public.is_store_owner(store_members.store_id)
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
-- 7. Strict Tenant-scoped RLS policies (Zero Bypass)
-- ---------------------------------------------------------------------------

-- Orders: strictly require authenticated store membership
DROP POLICY IF EXISTS "Tenant scoped orders" ON public.orders;
CREATE POLICY "Tenant scoped orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND store_id IS NOT NULL
    AND public.is_store_member(store_id)
  ) WITH CHECK (
    auth.role() = 'authenticated'
    AND store_id IS NOT NULL
    AND public.is_store_member(store_id)
  );

-- Products: strictly require authenticated store membership
DROP POLICY IF EXISTS "Tenant scoped products" ON public.products;
CREATE POLICY "Tenant scoped products" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND store_id IS NOT NULL
    AND public.is_store_member(store_id)
  ) WITH CHECK (
    auth.role() = 'authenticated'
    AND store_id IS NOT NULL
    AND public.is_store_member(store_id)
  );

-- Batch PO (if module installed): strictly require authenticated store membership
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_po') THEN
    DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;
    EXECUTE 'CREATE POLICY "Tenant scoped batch_po" ON public.batch_po
      FOR ALL USING (
        auth.role() = ''authenticated''
        AND store_id IS NOT NULL
        AND public.is_store_member(store_id)
      ) WITH CHECK (
        auth.role() = ''authenticated''
        AND store_id IS NOT NULL
        AND public.is_store_member(store_id)
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
-- DROP FUNCTION IF EXISTS public.is_store_owner(uuid);
-- DROP FUNCTION IF EXISTS public.is_store_admin(uuid);
-- DROP FUNCTION IF EXISTS public.is_store_member(uuid);
-- DROP TABLE IF EXISTS public.store_members;
