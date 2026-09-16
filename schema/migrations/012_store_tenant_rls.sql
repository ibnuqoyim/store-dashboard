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
-- 2. Helper functions for store isolation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_store_member(lookup_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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
STABLE
AS $$
  SELECT sm.store_id FROM public.store_members sm
  WHERE sm.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS for store_members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated read store_members" ON public.store_members;
CREATE POLICY "Authenticated read store_members" ON public.store_members
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Store owners manage members" ON public.store_members;
CREATE POLICY "Store owners manage members" ON public.store_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
    OR NOT EXISTS (
      -- If no members exist yet for this store, permit initial creator assignment
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Auto-assign store creator as owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_store_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
-- 5. Tenant-scoped RLS policies
-- ---------------------------------------------------------------------------

-- Orders: accessible if unassigned (single-store legacy) OR user belongs to store
DROP POLICY IF EXISTS "Tenant scoped orders" ON public.orders;
CREATE POLICY "Tenant scoped orders" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      store_id IS NULL OR public.is_store_member(store_id)
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND (
      store_id IS NULL OR public.is_store_member(store_id)
    )
  );

-- Products: accessible if unassigned (single-store legacy) OR user belongs to store
DROP POLICY IF EXISTS "Tenant scoped products" ON public.products;
CREATE POLICY "Tenant scoped products" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      store_id IS NULL OR public.is_store_member(store_id)
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND (
      store_id IS NULL OR public.is_store_member(store_id)
    )
  );

-- Batch PO: accessible if unassigned OR user belongs to store
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_po') THEN
    DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;
    EXECUTE 'CREATE POLICY "Tenant scoped batch_po" ON public.batch_po
      FOR ALL USING (
        auth.role() = ''authenticated'' AND (
          store_id IS NULL OR public.is_store_member(store_id)
        )
      ) WITH CHECK (
        auth.role() = ''authenticated'' AND (
          store_id IS NULL OR public.is_store_member(store_id)
        )
      )';
  END IF;
END $$;
