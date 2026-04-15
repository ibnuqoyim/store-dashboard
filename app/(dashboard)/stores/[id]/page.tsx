import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StoreDetail from '@/components/StoreDetail'

export const revalidate = 0

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const [storeResult, botConfigResult] = await Promise.all([
        supabase.from('stores').select('*').eq('id', id).single(),
        supabase.from('bot_config').select('*').eq('store_id', id).limit(1).maybeSingle(),
    ])

    if (storeResult.error || !storeResult.data) notFound()

    return (
        <StoreDetail
            store={storeResult.data}
            botConfig={botConfigResult.data ?? null}
        />
    )
}
