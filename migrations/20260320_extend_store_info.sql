ALTER TABLE public.store_info
  ADD COLUMN IF NOT EXISTS bank_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_closing_message text DEFAULT 'Terima Kasih',
  ADD COLUMN IF NOT EXISTS invoice_closing_sub text DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_greeting_template text DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'id-ID';
