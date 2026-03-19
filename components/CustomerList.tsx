
'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, Search, ArrowUp, ArrowDown, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
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
    const [hasPhoneFilter, setHasPhoneFilter] = useState<string>('all')
    const [hasAddressFilter, setHasAddressFilter] = useState<string>('all')
    const [purchaseFilter, setPurchaseFilter] = useState({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
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

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, hasPhoneFilter, hasAddressFilter, purchaseFilter, sortBy, sortOrder])

    const filteredCustomers = useMemo(() => {
        let result = customers

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerSearch) ||
                (c.phone && c.phone.toLowerCase().includes(lowerSearch)) ||
                (c.address && c.address.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by phone
        if (hasPhoneFilter !== 'all') {
            result = result.filter(c => 
                hasPhoneFilter === 'has' ? !!c.phone : !c.phone
            )
        }

        // Filter by address
        if (hasAddressFilter !== 'all') {
            result = result.filter(c => 
                hasAddressFilter === 'has' ? !!c.address : !c.address
            )
        }

        // Filter by purchase range
        if (purchaseFilter.min) {
            result = result.filter(c => c.total_purchases >= Number(purchaseFilter.min))
        }
        if (purchaseFilter.max) {
            result = result.filter(c => c.total_purchases <= Number(purchaseFilter.max))
        }

        // Sort
        return [...result].sort((a, b) => {
            let comparison = 0
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name)
            } else {
                comparison = a.total_purchases - b.total_purchases
            }
            return sortOrder === 'asc' ? comparison : -comparison
        })
    }, [customers, searchTerm, hasPhoneFilter, hasAddressFilter, purchaseFilter, sortBy, sortOrder])

    // Pagination
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredCustomers.slice(startIndex, endIndex)
    }, [filteredCustomers, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const totalItems = filteredCustomers.length

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Customers</h1>
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

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={18} className="text-gray-500" />
                    <h3 className="font-medium text-gray-700">Search & Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Name, phone, or address..."
                                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Phone Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={hasPhoneFilter}
                            onChange={(e) => setHasPhoneFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="has">Has Phone</option>
                            <option value="no_phone">No Phone</option>
                        </select>
                    </div>

                    {/* Address Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={hasAddressFilter}
                            onChange={(e) => setHasAddressFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="has">Has Address</option>
                            <option value="no_address">No Address</option>
                        </select>
                    </div>

                    {/* Items per page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Purchase Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Total Purchase</label>
                        <input
                            type="number"
                            placeholder="Min purchase"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={purchaseFilter.min}
                            onChange={(e) => setPurchaseFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Purchase</label>
                        <input
                            type="number"
                            placeholder="Max purchase"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={purchaseFilter.max}
                            onChange={(e) => setPurchaseFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {paginatedCustomers.length} of {totalItems} customers
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setHasPhoneFilter('all')
                            setHasAddressFilter('all')
                            setPurchaseFilter({ min: '', max: '' })
                            setCurrentPage(1)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear all filters
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
                            {paginatedCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                        {customer.description && (
                                            <div className="text-sm text-gray-500">{customer.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="max-w-xs truncate">{customer.address || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatRupiah(customer.total_purchases)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRecalculateSingleCustomer(customer.id)}
                                                disabled={recalculatingId === customer.id}
                                                className="text-amber-600 hover:text-amber-900 disabled:opacity-50"
                                                title="Recalculate total purchases"
                                            >
                                                {recalculatingId === customer.id ? (
                                                    <div className="animate-spin h-4 w-4 border-b-2 border-amber-600 rounded-full"></div>
                                                ) : (
                                                    <ArrowUp size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCustomer(customer)
                                                    setIsModalOpen(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                disabled={isLoading}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        {filteredCustomers.length === 0 ? 'No customers found.' : 'No customers found for current page.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                                <span className="font-medium">{totalItems}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = currentPage - 2 + i
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingCustomer(null)
                }}
                onSave={handleSave}
                customer={editingCustomer}
            />
        </div>
    )
}
