
'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerModal from './CustomerModal'

export type Customer = {
    id: string
    name: string
    phone?: string
    address?: string
    total_purchases: number
    default_courier?: string
    description?: string
    created_at?: string
}

export default function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [sortBy, setSortBy] = useState<'name' | 'total_purchases'>('name')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isRecalculating, setIsRecalculating] = useState(false)
    const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleRecalculateSingleCustomer = async (customerId: string) => {
        setRecalculatingId(customerId)
        try {
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('order_items(price, quantity)')
                .eq('customer_id', customerId)

            if (ordersError) throw ordersError

            // Sum all order items
            let totalPurchases = 0
            orders.forEach((order: any) => {
                if (order.order_items) {
                    order.order_items.forEach((item: any) => {
                        totalPurchases += (item.price || 0) * (item.quantity || 0)
                    })
                }
            })

            // Update customer with new total
            const { error: updateError } = await supabase
                .from('customers')
                .update({ total_purchases: totalPurchases })
                .eq('id', customerId)

            if (updateError) throw updateError

            // Update local state
            setCustomers(customers.map(c => 
                c.id === customerId ? { ...c, total_purchases: totalPurchases } : c
            ))
        } catch (error) {
            console.error('Error recalculating customer total:', error)
            alert('Failed to recalculate total purchases for this customer')
        } finally {
            setRecalculatingId(null)
        }
    }

    const handleRecalculateTotalPurchases = async () => {
        if (!confirm('This will recalculate total purchases for ALL customers (excluding shipping costs). Continue?')) return

        setIsRecalculating(true)
        try {
            // Get all customers
            const { data: allCustomers, error: fetchError } = await supabase
                .from('customers')
                .select('id')

            if (fetchError) throw fetchError

            // For each customer, calculate total purchases from order items
            for (const customer of allCustomers) {
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('order_items(price, quantity)')
                    .eq('customer_id', customer.id)

                if (ordersError) throw ordersError

                // Sum all order items
                let totalPurchases = 0
                orders.forEach((order: any) => {
                    if (order.order_items) {
                        order.order_items.forEach((item: any) => {
                            totalPurchases += (item.price || 0) * (item.quantity || 0)
                        })
                    }
                })

                // Update customer with new total
                const { error: updateError } = await supabase
                    .from('customers')
                    .update({ total_purchases: totalPurchases })
                    .eq('id', customer.id)

                if (updateError) throw updateError
            }

            // Refresh the page to show updated values
            router.refresh()
            alert('Total purchases recalculated successfully for all customers!')
        } catch (error) {
            console.error('Error recalculating total purchases:', error)
            alert('Failed to recalculate total purchases')
        } finally {
            setIsRecalculating(false)
        }
    }

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.phone && customer.phone.includes(searchTerm))
            )
            .sort((a, b) => {
                let comparison = 0
                if (sortBy === 'name') {
                    comparison = a.name.localeCompare(b.name)
                } else if (sortBy === 'total_purchases') {
                    comparison = a.total_purchases - b.total_purchases
                }
                return sortOrder === 'asc' ? comparison : -comparison
            })
    }, [customers, searchTerm, sortOrder, sortBy])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) throw error

            setCustomers(customers.filter(c => c.id !== id))
            router.refresh()
        } catch (error) {
            console.error('Error deleting customer:', error)
            alert('Failed to delete customer')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = (customer: Customer) => {
        if (editingCustomer) {
            setCustomers(customers.map(c => c.id === customer.id ? customer : c))
        } else {
            setCustomers([customer, ...customers])
        }
        setIsModalOpen(false)
        setEditingCustomer(null)
        router.refresh()
    }

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const toggleSort = (field: 'name' | 'total_purchases') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleRecalculateTotalPurchases}
                        disabled={isRecalculating}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{isRecalculating ? 'Recalculating...' : 'Recalculate All'}</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingCustomer(null)
                            setIsModalOpen(true)
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add Customer</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleSort('name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Name</span>
                                        {sortBy === 'name' && (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Address
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleSort('total_purchases')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Total Purchases</span>
                                        {sortBy === 'total_purchases' && (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                            {customer.description && (
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{customer.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {customer.address || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatRupiah(customer.total_purchases)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={() => handleRecalculateSingleCustomer(customer.id)}
                                                    disabled={recalculatingId === customer.id}
                                                    className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Recalculate total purchases"
                                                >
                                                    <span className="text-xs font-semibold">↻</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingCustomer(customer)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <CustomerModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingCustomer(null)
                    }}
                    onSave={handleSave}
                    customer={editingCustomer}
                />
            )}
        </div>
    )
}
