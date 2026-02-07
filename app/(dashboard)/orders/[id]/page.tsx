
import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const [productsResult, orderResult, batchesResult] = await Promise.all([
        supabase.from('products').select('id, name, price').order('name'),
        supabase.from('orders')
            .select(`*, order_items(*), deliveries(*)`)
            .eq('id', id)
            .single(),
        supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
    ])

    const products = productsResult.data
    const order = orderResult.data
    const batches = batchesResult.data

    if (!order) notFound()

    return <OrderForm products={products || []} batches={batches || []} initialOrder={order} />
}
