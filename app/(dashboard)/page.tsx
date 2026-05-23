
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: storeInfo } = await supabase.from('store_info').select('id, modules_enabled, widget_config').single()
    const modules: string[] = storeInfo?.modules_enabled ?? []
    const hasAdonan = modules.includes('adonan')
    const hasBatchPo = modules.includes('batch-po')

    const [ordersResult, productsResult, adonanResult, batchesResult, storesResult] = await Promise.all([
        supabase
            .from('orders')
            .select('*, order_items(*, products(*)), deliveries(shipping_cost)'),
        hasAdonan
            ? supabase.from('products').select('*, adonan(*)')
            : supabase.from('products').select('*'),
        hasAdonan
            ? supabase.from('adonan').select('*')
            : Promise.resolve({ data: [] }),
        hasBatchPo
            ? supabase.from('batch_po').select('*').order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        supabase.from('stores').select('id, logo_url, name, phone, bank_name, bank_account, bank_holder, invoice_closing_message, invoice_closing_sub'),
    ])

    const orders = ordersResult.data || []
    const allProducts = productsResult.data || []
    const allAdonan = adonanResult.data || []
    const batches = batchesResult.data || []
    const stores = storesResult.data || []

    return (
        <DashboardClient
            storeInfoId={storeInfo?.id ?? ''}
            initialWidgetConfig={storeInfo?.widget_config ?? null}
            orders={orders}
            products={allProducts}
            adonan={allAdonan}
            batches={batches}
            stores={stores}
        />
    )
}
