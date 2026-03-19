import { createClient } from '@/utils/supabase/server'
import FinancialReport from '@/components/FinancialReport'

export const revalidate = 0

export default async function FinancialPage() {
    const supabase = await createClient()

    return <FinancialReport />
}
