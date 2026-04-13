import { createClient } from '@/utils/supabase/server'
import StoreList from '@/components/StoreList'

export const revalidate = 0

export default async function StoresPage() {
    const supabase = await createClient()

    const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: true })

    return <StoreList initialStores={stores || []} />
}
