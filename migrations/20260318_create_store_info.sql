CREATE TABLE IF NOT EXISTS public.store_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,

  -- Core identity
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  opening_hours text NOT NULL,

  -- Maps
  maps_url text,
  maps_embed_url text,

  -- Hero section
  hero_kicker text,
  hero_title text,
  hero_tagline text,
  hero_description text,
  hero_images text[] NOT NULL DEFAULT '{}',
  hero_stats jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Tagline/why-us section
  tagline_heading text,
  tagline_subheading text,
  tagline_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tagline_quote text,

  -- Contact section
  contact_instagram_handle text,
  contact_instagram_url text,
  contact_whatsapp_number text,
  contact_whatsapp_url text,
  contact_email text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_info ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo (replace with proper policies for production)
CREATE POLICY "Allow public access" ON public.store_info
  FOR ALL USING (true) WITH CHECK (true);
