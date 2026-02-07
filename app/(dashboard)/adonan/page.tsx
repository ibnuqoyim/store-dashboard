
import { createClient } from '@/utils/supabase/server'
import AdonanList from '@/components/AdonanList'

export const revalidate = 0

export default async function AdonanPage() {
    const supabase = await createClient()
    const { data: adonan } = await supabase.from('adonan').select('*').order('name')

    return <AdonanList initialAdonan={adonan || []} />
}
