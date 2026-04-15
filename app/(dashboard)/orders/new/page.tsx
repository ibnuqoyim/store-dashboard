
import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'

export const revalidate = 0

export default async function NewOrderPage() {
    const supabase = await createClient()

    const { data: storeInfo } = await supabase.from('store_info').select('modules_enabled').single()
    const hasBatchPo = (storeInfo?.modules_enabled ?? []).includes('batch-po')

    const [productsResult, batchesResult, storesResult] = await Promise.all([
        supabase.from('products').select('id, name, price').order('name'),
        hasBatchPo
            ? supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        supabase.from('stores').select('id, name, invoice_prefix'),
    ])

    return <OrderForm products={productsResult.data || []} batches={batchesResult.data || []} stores={storesResult.data || []} />
}
