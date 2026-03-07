import { createClient } from '@/utils/supabase/server'
import POList from '@/components/POList'

export const revalidate = 0

export default async function POPage() {
    const supabase = await createClient()

    const { data: pos = [] } = await supabase
    .from('batch_po')
    .select('*')
    .order('created_at', { ascending: false })

    return <POList initialPOs={pos ?? []} />
}
