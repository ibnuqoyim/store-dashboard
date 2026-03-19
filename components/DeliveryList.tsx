
'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Truck, MapPin, ExternalLink, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Delivery = {
    id: string
    courier_name: string
    shipping_cost: number
    address: string
    status: string
    orders: {
        id: string
        invoice_number: string
        customer_name: string
    }
}

export default function DeliveryList({ initialDeliveries }: { initialDeliveries: Delivery[] }) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [courierFilter, setCourierFilter] = useState<string>('all')
    const [costFilter, setCostFilter] = useState({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const router = useRouter()
    const supabase = createClient()

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, courierFilter, costFilter])

    const filteredDeliveries = useMemo(() => {
        let result = initialDeliveries

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(d =>
                d.courier_name.toLowerCase().includes(lowerSearch) ||
                d.address.toLowerCase().includes(lowerSearch) ||
                d.orders.invoice_number.toLowerCase().includes(lowerSearch) ||
                d.orders.customer_name.toLowerCase().includes(lowerSearch)
            )
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(d => d.status === statusFilter)
        }

        // Filter by courier
        if (courierFilter !== 'all') {
            result = result.filter(d => d.courier_name === courierFilter)
        }

        // Filter by cost range
        if (costFilter.min) {
            result = result.filter(d => d.shipping_cost >= Number(costFilter.min))
        }
        if (costFilter.max) {
            result = result.filter(d => d.shipping_cost <= Number(costFilter.max))
        }

        return result
    }, [initialDeliveries, searchTerm, statusFilter, courierFilter, costFilter])

    // Pagination
    const paginatedDeliveries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredDeliveries.slice(startIndex, endIndex)
    }, [filteredDeliveries, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage)
    const totalItems = filteredDeliveries.length

    // Get unique couriers for filter
    const uniqueCouriers = useMemo(() => {
        const couriers = new Set(initialDeliveries.map(d => d.courier_name))
        return Array.from(couriers).sort()
    }, [initialDeliveries])

    const updateStatus = async (id: string, newStatus: string) => {
        setIsLoading(id)
        const { error } = await supabase.from('deliveries').update({ status: newStatus }).eq('id', id)
        setIsLoading(null)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            router.refresh()
        }
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'shipped': return 'bg-blue-100 text-blue-800'
            default: return 'bg-yellow-100 text-yellow-800'
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Deliveries</h1>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
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
                                placeholder="Courier, address, invoice..."
                                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                        </select>
                    </div>

                    {/* Courier Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Courier</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={courierFilter}
                            onChange={(e) => setCourierFilter(e.target.value)}
                        >
                            <option value="all">All Couriers</option>
                            {uniqueCouriers.map(courier => (
                                <option key={courier} value={courier}>{courier}</option>
                            ))}
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

                {/* Cost Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Cost</label>
                        <input
                            type="number"
                            placeholder="Min shipping cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.min}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Cost</label>
                        <input
                            type="number"
                            placeholder="Max shipping cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.max}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {paginatedDeliveries.length} of {totalItems} deliveries
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('all')
                            setCourierFilter('all')
                            setCostFilter({ min: '', max: '' })
                            setCurrentPage(1)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedDeliveries.map((delivery) => (
                            <tr key={delivery.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-blue-600">
                                        <Link href={`/orders/${delivery.orders.id}`} className="flex items-center gap-1 hover:underline">
                                            {delivery.orders.invoice_number} <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                    <div className="text-sm text-gray-500">{delivery.orders.customer_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Truck size={16} className="text-gray-400" />
                                        {delivery.courier_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatRupiah(delivery.shipping_cost)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    <div className="flex items-center gap-2" title={delivery.address}>
                                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{delivery.address || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isLoading === delivery.id ? (
                                        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                                    ) : (
                                        <select
                                            value={delivery.status}
                                            onChange={(e) => updateStatus(delivery.id, e.target.value)}
                                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusColor(delivery.status)}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedDeliveries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    {filteredDeliveries.length === 0 ? 'No deliveries found.' : 'No deliveries found for current page.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
        </div>
    )
}
