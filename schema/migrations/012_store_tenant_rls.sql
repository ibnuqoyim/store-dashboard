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
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON public.store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON public.store_members(store_id);

-- ---------------------------------------------------------------------------
-- 2. Immutability trigger for store_members (prevents moving members across stores)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_store_member_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.store_id != OLD.store_id OR NEW.user_id != OLD.user_id THEN
    RAISE EXCEPTION 'store_id and user_id are immutable in store_members';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_store_member_immutability ON public.store_members;
CREATE TRIGGER tr_protect_store_member_immutability
  BEFORE UPDATE ON public.store_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_store_member_immutability();

-- ---------------------------------------------------------------------------
-- 3. Backfill existing stores and users into store_members
-- When unambiguous (single user or single store), link existing users to avoid lockout
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  user_count int;
  primary_user_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    IF user_count = 1 THEN
      SELECT id INTO primary_user_id FROM auth.users LIMIT 1;
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
-- 4. Helper functions for store isolation (with search_path and row_security protection)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_store_member(lookup_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
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
SET row_security = off
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
SET row_security = off
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members sm
    WHERE sm.store_id = lookup_store_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'owner'
  );
$$;

-- Restrict RPC execution: prevent anonymous enumeration, allow authenticated & service_role
REVOKE ALL ON FUNCTION public.is_store_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_store_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_store_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Granular RLS for store_members (with role-escalation prevention)
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
DROP POLICY IF EXISTS "Store creator bootstraps owner" ON public.store_members;
DROP POLICY IF EXISTS "Store owners insert members" ON public.store_members;

-- Only owners can grant owner role; admins can insert non-owner roles
CREATE POLICY "Store owners insert members" ON public.store_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      (role = 'owner' AND public.is_store_owner(store_members.store_id))
      OR (role != 'owner' AND public.is_store_admin(store_members.store_id))
    )
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
-- 6. Auto-assign store creator as owner (via SECURITY DEFINER trigger)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_store_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
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
-- 7. Scoped RLS for stores table
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated access stores" ON public.stores;
DROP POLICY IF EXISTS "Members view stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated insert stores" ON public.stores;
DROP POLICY IF EXISTS "Owners update stores" ON public.stores;
DROP POLICY IF EXISTS "Owners delete stores" ON public.stores;

CREATE POLICY "Members view stores" ON public.stores
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      public.is_store_member(id)
      OR NOT EXISTS (SELECT 1 FROM public.store_members sm WHERE sm.store_id = stores.id)
    )
  );

CREATE POLICY "Authenticated insert stores" ON public.stores
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Owners update stores" ON public.stores
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND public.is_store_owner(id)
  ) WITH CHECK (
    auth.role() = 'authenticated' AND public.is_store_owner(id)
  );

CREATE POLICY "Owners delete stores" ON public.stores
  FOR DELETE USING (
    auth.role() = 'authenticated' AND public.is_store_owner(id)
  );

-- ---------------------------------------------------------------------------
-- 8. High-performance Tenant-scoped RLS policies (O(1) checks without nested subqueries)
-- ---------------------------------------------------------------------------

-- Orders
DROP POLICY IF EXISTS "Public Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated access orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.orders;
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

-- Products
DROP POLICY IF EXISTS "Public Access Products" ON public.products;
DROP POLICY IF EXISTS "Authenticated access products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.products;
DROP POLICY IF EXISTS "Enable update for all users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;
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

-- Batch PO (if module installed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'batch_po') THEN
    DROP POLICY IF EXISTS "Public Access Batch PO" ON public.batch_po;
    DROP POLICY IF EXISTS "Authenticated access batch_po" ON public.batch_po;
    DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;

    CREATE POLICY "Tenant scoped batch_po" ON public.batch_po
      FOR ALL USING (
        auth.role() = 'authenticated' AND (
          store_id IS NULL OR public.is_store_member(store_id)
        )
      ) WITH CHECK (
        auth.role() = 'authenticated' AND (
          store_id IS NULL OR public.is_store_member(store_id)
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Rollback Instructions (Down Migration reference):
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS tr_protect_store_member_immutability ON public.store_members;
-- DROP FUNCTION IF EXISTS public.protect_store_member_immutability();
-- DROP TRIGGER IF EXISTS tr_new_store_creator ON public.stores;
-- DROP FUNCTION IF EXISTS public.handle_new_store_creator();
-- DROP POLICY IF EXISTS "Owners delete stores" ON public.stores;
-- DROP POLICY IF EXISTS "Owners update stores" ON public.stores;
-- DROP POLICY IF EXISTS "Authenticated insert stores" ON public.stores;
-- DROP POLICY IF EXISTS "Members view stores" ON public.stores;
-- DROP POLICY IF EXISTS "Tenant scoped orders" ON public.orders;
-- DROP POLICY IF EXISTS "Tenant scoped products" ON public.products;
-- DROP POLICY IF EXISTS "Tenant scoped batch_po" ON public.batch_po;
-- DROP POLICY IF EXISTS "Store owners delete members" ON public.store_members;
-- DROP POLICY IF EXISTS "Store owners update members" ON public.store_members;
-- DROP POLICY IF EXISTS "Store owners insert members" ON public.store_members;
-- DROP POLICY IF EXISTS "Members view store_members" ON public.store_members;
-- DROP FUNCTION IF EXISTS public.is_store_owner(uuid);
-- DROP FUNCTION IF EXISTS public.is_store_admin(uuid);
-- DROP FUNCTION IF EXISTS public.is_store_member(uuid);
-- DROP TABLE IF EXISTS public.store_members;
