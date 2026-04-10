import { createClient } from '@/utils/supabase/server'
import RecipeManager from '@/components/RecipeManager'

export const revalidate = 0

export default async function ResepPage() {
    const supabase = await createClient()

    const [{ data: products }, { data: inventory }] = await Promise.all([
        supabase.from('products').select('id, name').order('name'),
        supabase.from('inventory').select('id, name, unit, unit_cost, category').order('name'),
    ])

    return (
        <RecipeManager
            initialProducts={products ?? []}
            initialInventory={inventory ?? []}
        />
    )
}
