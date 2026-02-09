
import { createClient } from '@/utils/supabase/server'
import CustomerList from '@/components/CustomerList'

export default async function CustomersPage() {
    const supabase = await createClient()

    // Fetch customers
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_purchases', { ascending: false })

    if (error) {
        console.error('Error fetching customers:', error)
        return <div>Error loading customers</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <CustomerList initialCustomers={customers || []} />
        </div>
    )
}
