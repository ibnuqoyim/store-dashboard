-- Create function to insert expense transaction when operational expense is added
create or replace function insert_expense_transaction()
returns trigger as $$
begin
  -- Insert expense transaction to financial_transactions
  insert into financial_transactions (
    transaction_type,
    amount,
    description,
    transaction_date
  ) values (
    'expense',
    new.amount,
    'Pengeluaran ' || new.category || ': ' || COALESCE(new.description, ''),
    new.expense_date::timestamp with time zone
  );
  
  return new;
end;
$$ language plpgsql;

-- Create trigger for operational expenses
create trigger trigger_expense_transaction
  after insert on operational_expenses
  for each row
  execute function insert_expense_transaction();
