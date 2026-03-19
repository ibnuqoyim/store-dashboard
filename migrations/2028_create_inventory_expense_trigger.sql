-- Create function to insert expense transaction when inventory is purchased (transaction_type = 'in')
create or replace function insert_inventory_expense_transaction()
returns trigger as $$
begin
  -- Only insert expense transaction for inventory purchases (transaction_type = 'in')
  if new.transaction_type = 'in' then
    -- Get inventory item info
    declare
      item_info record;
    begin
      select i.name, i.category
      into item_info
      from inventory i
      where i.id = new.inventory_id;
      
      -- Insert expense transaction to financial_transactions
      insert into financial_transactions (
        transaction_type,
        amount,
        description,
        transaction_date
      ) values (
        'expense',
        new.total_cost,
        'Pembelian ' || item_info.category || ': ' || item_info.name || 
        CASE WHEN new.reference IS NOT NULL AND new.reference != '' THEN ' (' || new.reference || ')' ELSE '' END,
        new.transaction_date
      );
    end;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger for inventory transactions
create trigger trigger_inventory_expense_transaction
  after insert on inventory_transactions
  for each row
  execute function insert_inventory_expense_transaction();
