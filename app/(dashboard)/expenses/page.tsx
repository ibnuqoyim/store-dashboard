import { createClient } from '@/utils/supabase/server'
import ExpenseForm from '@/components/ExpenseForm'

export const revalidate = 0

export default async function ExpensesPage() {
    const supabase = await createClient()

    return <ExpenseForm />
}
