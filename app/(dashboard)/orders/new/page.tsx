
import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'

export const revalidate = 0

export default async function NewOrderPage() {
    const supabase = await createClient()
    const [productsResult, batchesResult] = await Promise.all([
        supabase.from('products').select('id, name, price').order('name'),
        supabase.from('batch_po').select('id, name').order('created_at', { ascending: false })
    ])

    return <OrderForm products={productsResult.data || []} batches={batchesResult.data || []} />
}
