
import { createClient } from '@/utils/supabase/server'
import ShippingRatesList from '@/components/ShippingRatesList'

export const revalidate = 0

export default async function ShippingPage() {
    const supabase = await createClient()

    const { data: rates } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('courier_name', { ascending: true })

    return <ShippingRatesList initialRates={rates || []} />
}
