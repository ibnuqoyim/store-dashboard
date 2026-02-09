
import { createClient } from '@/utils/supabase/server'
import OrderList from '@/components/OrderList'

export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()
  const [ordersResult, batchesResult] = await Promise.all([
    supabase.from('orders')
      .select(`
        *,
        customer_id,
        order_items (
          price,
          quantity,
          products (name)
        ),
        deliveries (
          status,
          courier_name
        )
      `)
      .order('date', { ascending: false }),
    supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
  ])

  return <OrderList initialOrders={ordersResult.data || []} batches={batchesResult.data || []} />
}
