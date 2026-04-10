import { createClient } from '@/utils/supabase/server'
import ProductionManager from '@/components/ProductionManager'

export const revalidate = 0

export default async function ProduksiPage() {
    const supabase = await createClient()

    const { data: recipes } = await supabase
        .from('recipes')
        .select('id, name, yield_quantity, yield_unit')
        .order('name')

    return <ProductionManager initialRecipes={recipes ?? []} />
}
