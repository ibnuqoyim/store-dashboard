
-- Create batch_po table
CREATE TABLE IF NOT EXISTS batch_po (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add po_id to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES batch_po(id) ON DELETE SET NULL;

-- Enable RLS for batch_po
ALTER TABLE batch_po ENABLE ROW LEVEL SECURITY;

-- Allow public access (for seeding/viewing)
CREATE POLICY "Public Access Batch PO" ON batch_po FOR ALL USING (true);
