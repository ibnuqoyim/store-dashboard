-- Create inventory table for raw materials and packaging
create table inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('bahan_baku', 'packaging')),
  unit text not null, -- e.g., 'kg', 'pcs', 'liter', 'box'
  current_stock numeric not null default 0 check (current_stock >= 0),
  min_stock numeric not null default 0 check (min_stock >= 0),
  unit_cost numeric not null check (unit_cost >= 0),
  supplier text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create inventory_transactions table for stock movements
create table inventory_transactions (
  id uuid default uuid_generate_v4() primary key,
  inventory_id uuid references inventory(id) on delete cascade not null,
  transaction_type text not null check (transaction_type in ('in', 'out')),
  quantity numeric not null,
  unit_cost numeric,
  total_cost numeric,
  reference text, -- e.g., invoice number, supplier name
  notes text,
  transaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create operational_expenses table
create table operational_expenses (
  id uuid default uuid_generate_v4() primary key,
  category text not null, -- e.g., 'listrik', 'internet', 'gaji', 'sewa', 'dll'
  amount numeric not null check (amount > 0),
  description text,
  expense_date date not null,
  payment_method text, -- e.g., 'transfer', 'cash', 'card'
  receipt_number text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table inventory enable row level security;
alter table inventory_transactions enable row level security;
alter table operational_expenses enable row level security;

-- Policies for authenticated users
create policy "Enable all access for authenticated users" on inventory for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on inventory_transactions for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on operational_expenses for all using (auth.role() = 'authenticated');

-- Create indexes for better performance
create index idx_inventory_category on inventory(category);
create index idx_inventory_name on inventory(name);
create index idx_inventory_transactions_inventory_id on inventory_transactions(inventory_id);
create index idx_inventory_transactions_type on inventory_transactions(transaction_type);
create index idx_inventory_transactions_date on inventory_transactions(transaction_date);
create index idx_operational_expenses_category on operational_expenses(category);
create index idx_operational_expenses_date on operational_expenses(expense_date);

-- Create trigger to update updated_at in inventory
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_inventory_updated_at
  before update on inventory
  for each row
  execute function update_updated_at_column();

-- Create trigger to update inventory stock after transaction
create or replace function update_inventory_stock()
returns trigger as $$
begin
  if new.transaction_type = 'in' then
    update inventory 
    set current_stock = current_stock + new.quantity
    where id = new.inventory_id;
  elsif new.transaction_type = 'out' then
    update inventory 
    set current_stock = current_stock - new.quantity
    where id = new.inventory_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_stock_after_transaction
  after insert on inventory_transactions
  for each row
  execute function update_inventory_stock();
