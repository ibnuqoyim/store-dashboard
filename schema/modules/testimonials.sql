-- =============================================================================
-- modules/testimonials.sql — Customer testimonials module
-- Prerequisites: schema/core.sql must be applied first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read testimonials (for embedding on a public website).
-- Only authenticated store owners can write/edit.
CREATE POLICY "Public read testimonials" ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY "Authenticated modify testimonials" ON public.testimonials
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
