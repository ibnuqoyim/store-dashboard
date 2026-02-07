-- Allow public access (Anon key) to insert/update/delete records
-- Run this in your Supabase SQL Editor to fix the RLS errors during seeding.

create policy "Public Access Adonan" on adonan for all using (true);
create policy "Public Access Products" on products for all using (true);
create policy "Public Access Orders" on orders for all using (true);
create policy "Public Access Order Items" on order_items for all using (true);
create policy "Public Access Deliveries" on deliveries for all using (true);
