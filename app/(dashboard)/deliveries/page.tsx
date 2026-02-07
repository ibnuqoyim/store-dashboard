
import { createClient } from '@/utils/supabase/server'
import DeliveryList from '@/components/DeliveryList'

export const revalidate = 0

export default async function DeliveriesPage() {
  const supabase = await createClient()
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      orders (
        id,
        invoice_number,
        customer_name
      )
    `)
    .order('created_at', { ascending: false })

  return <DeliveryList initialDeliveries={deliveries || []} />
}
