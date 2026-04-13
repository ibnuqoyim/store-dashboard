import { createClient } from '@/utils/supabase/server'
import BotConfigForm from '@/components/BotConfigForm'

export const revalidate = 0

export default async function BotConfigPage() {
    const supabase = await createClient()

    const [configResult, storesResult] = await Promise.all([
        supabase.from('bot_config').select('*').limit(1).maybeSingle(),
        supabase.from('stores').select('id, name').eq('is_active', true).order('name'),
    ])

    return (
        <BotConfigForm
            initialConfig={configResult.data}
            stores={storesResult.data || []}
        />
    )
}
