-- =============================================================================
-- modules/bot-config.sql — WhatsApp bot runtime configuration
-- Prerequisites: schema/core.sql must be applied first.
-- =============================================================================

CREATE TABLE IF NOT EXISTS bot_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  system_prompt text NOT NULL DEFAULT '',
  allowed_numbers text NOT NULL DEFAULT '', -- comma-separated phone numbers
  ai_provider text NOT NULL DEFAULT 'openrouter',
  ai_model text NOT NULL DEFAULT 'openai/gpt-4o-mini',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access bot_config" ON bot_config
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
