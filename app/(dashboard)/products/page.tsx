
import { createClient } from '@/utils/supabase/server'
import ProductList from '@/components/ProductList'

export const revalidate = 0

export default async function ProductsPage() {
    const supabase = await createClient()
    const { data: products } = await supabase.from('products').select('*, adonan(name)').order('name')
    const { data: doughs } = await supabase.from('adonan').select('id, name').order('name')

    return <ProductList initialProducts={products || []} doughs={doughs || []} />
}
