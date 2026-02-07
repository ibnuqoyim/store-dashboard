
import { createClient } from '@/utils/supabase/server'
import InvoiceGenerator from '@/components/InvoiceGenerator'

export const revalidate = 0

export default async function InvoicesPage() {
    const supabase = await createClient()
    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
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
        .order('date', { ascending: false })

    // Using batches for filtering if needed? The request said "Invoice Generator based on invoice-dashboard-local.html"
    const { data: batches } = await supabase.from('batch_po').select('*').order('created_at', { ascending: false })

    return <InvoiceGenerator orders={orders || []} batches={batches || []} />
}
