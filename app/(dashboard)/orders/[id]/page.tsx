
import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: storeInfo } = await supabase.from('store_info').select('modules_enabled').single()
    const hasBatchPo = (storeInfo?.modules_enabled ?? []).includes('batch-po')

    const [productsResult, orderResult, batchesResult, storesResult] = await Promise.all([
        supabase.from('products').select('id, name, price').order('name'),
        supabase.from('orders')
            .select(`*, order_items(*), deliveries(*)`)
            .eq('id', id)
            .single(),
        hasBatchPo
            ? supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        supabase.from('stores').select('id, name, invoice_prefix'),
    ])

    const products = productsResult.data
    const order = orderResult.data
    const batches = batchesResult.data

    if (!order) notFound()

    return <OrderForm products={products || []} batches={batches || []} stores={storesResult.data || []} initialOrder={order} />
}
