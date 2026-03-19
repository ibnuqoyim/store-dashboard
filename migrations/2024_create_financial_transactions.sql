-- Create financial_transactions table
create table financial_transactions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  description text,
  transaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table financial_transactions enable row level security;

-- Policy for authenticated users
create policy "Enable all access for authenticated users" on financial_transactions for all using (auth.role() = 'authenticated');

-- Create index for better performance
create index idx_financial_transactions_order_id on financial_transactions(order_id);
create index idx_financial_transactions_type on financial_transactions(transaction_type);
create index idx_financial_transactions_date on financial_transactions(transaction_date);
