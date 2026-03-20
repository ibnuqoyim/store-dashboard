ALTER TABLE public.store_info
  ADD COLUMN IF NOT EXISTS modules_enabled text[] DEFAULT '{}';
