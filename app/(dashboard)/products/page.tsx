
import { createClient } from '@/utils/supabase/server'
import ProductList from '@/components/ProductList'

export const revalidate = 0

export default async function ProductsPage() {
    const supabase = await createClient()

    const { data: storeInfo } = await supabase.from('store_info').select('modules_enabled').single()
    const hasAdonan = (storeInfo?.modules_enabled ?? []).includes('adonan')

    const [productsResult, doughsResult] = await Promise.all([
        hasAdonan
            ? supabase.from('products').select('*, adonan(name)').order('name')
            : supabase.from('products').select('*').order('name'),
        hasAdonan
            ? supabase.from('adonan').select('id, name').order('name')
            : Promise.resolve({ data: [] }),
    ])

    return <ProductList initialProducts={productsResult.data || []} doughs={doughsResult.data || []} />
}
