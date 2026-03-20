ALTER TABLE public.store_info
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
