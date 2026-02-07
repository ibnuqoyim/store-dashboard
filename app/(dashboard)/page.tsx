
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch all required data
    const [ordersResult, productsResult, adonanResult, batchesResult] = await Promise.all([
        supabase
            .from('orders')
            .select('*, order_items(*, products(*)), deliveries(shipping_cost)'),
        supabase.from('products').select('*, adonan(*)'),
        supabase.from('adonan').select('*'),
        supabase.from('batch_po').select('*').order('created_at', { ascending: false })
    ])

    const orders = ordersResult.data || []
    const allProducts = productsResult.data || []
    const allAdonan = adonanResult.data || []
    const batches = batchesResult.data || []

    return (
        <DashboardClient
            orders={orders}
            products={allProducts}
            adonan={allAdonan}
            batches={batches}
        />
    )
}
