
import { createClient } from '@/utils/supabase/server'
import OrderList from '@/components/OrderList'

export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: storeInfo } = await supabase.from('store_info').select('modules_enabled').single()
  const hasBatchPo = (storeInfo?.modules_enabled ?? []).includes('batch-po')

  const [ordersResult, batchesResult, storesResult] = await Promise.all([
    supabase.from('orders')
      .select(`
        *,
        customer_id,
        store_id,
        order_items (
          price,
          quantity,
          products (name)
        ),
        deliveries (
          status,
          courier_name,
          shipping_cost
        )
      `)
      .order('date', { ascending: false }),
    hasBatchPo
      ? supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('stores').select('id, logo_url'),
  ])

  return <OrderList initialOrders={ordersResult.data || []} batches={batchesResult.data || []} stores={storesResult.data || []} />
}
