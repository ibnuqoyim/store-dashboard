import { createClient } from '@/utils/supabase/server'
import BotConfigForm from '@/components/BotConfigForm'

export const revalidate = 0

export default async function BotConfigPage() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('bot_config')
        .select('*')
        .limit(1)
        .maybeSingle()

    return <BotConfigForm initialConfig={data} />
}
