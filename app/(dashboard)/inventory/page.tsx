import { createClient } from '@/utils/supabase/server'
import InventoryForm from '@/components/InventoryForm'

export const revalidate = 0

export default async function InventoryPage() {
    const supabase = await createClient()

    return <InventoryForm />
}
