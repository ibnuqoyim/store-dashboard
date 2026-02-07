-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: adonan
create table adonan (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  weight numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: products
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  dough_id uuid references adonan(id),
  weight numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: orders
create table orders (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null unique,
  date date not null,
  due_date date,
  customer_name text not null,
  phone text,
  status text default 'pending', -- 'pending', 'paid'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: order_items
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id),
  quantity integer not null,
  price numeric not null, -- snapshot price
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: deliveries
create table deliveries (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  courier_name text,
  shipping_cost numeric not null,
  address text,
  status text default 'pending', -- 'pending', 'shipped', 'delivered'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - Enable for all tables
alter table adonan enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table deliveries enable row level security;

-- Policies (Simple public read/write for now, or authenticated)
-- For this prototype/dashboard, we'll allow authenticated users full access.

create policy "Enable all access for authenticated users" on adonan for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on products for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on orders for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on order_items for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on deliveries for all using (auth.role() = 'authenticated');

-- Optional: Allow public read if needed for landing page later
-- create policy "Enable read access for all users" on products for select using (true);
