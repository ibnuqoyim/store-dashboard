-- Create function to insert financial transaction when order is paid
create or replace function insert_financial_transaction()
returns trigger as $$
begin
  -- Only insert transaction if status is being changed to 'paid'
  if new.status = 'paid' and old.status != 'paid' then
    -- Calculate total amount from order items and shipping
    declare
      total_amount numeric;
    begin
      select coalesce(sum(oi.quantity * oi.price), 0) + coalesce(sum(d.shipping_cost), 0)
      into total_amount
      from orders o
      left join order_items oi on o.id = oi.order_id
      left join deliveries d on o.id = d.order_id
      where o.id = new.id;
      
      -- Insert income transaction
      insert into financial_transactions (
        order_id,
        transaction_type,
        amount,
        description,
        transaction_date
      ) values (
        new.id,
        'income',
        total_amount,
        'Pembayaran Order ' || new.invoice_number || ' - ' || new.customer_name,
        new.created_at
      );
    end;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger trigger_financial_transaction
  after update on orders
  for each row
  execute function insert_financial_transaction();
