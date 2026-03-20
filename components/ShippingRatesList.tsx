
'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'

type ShippingRate = {
    id: string
    courier_name: string
    description: string
    cost: number
}

export default function ShippingRatesList({ initialRates }: { initialRates: ShippingRate[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [courierFilter, setCourierFilter] = useState<string>('all')
    const [costFilter, setCostFilter] = useState({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const router = useRouter()
    const supabase = createClient()
    const config = useBusinessConfig()

    const [formData, setFormData] = useState({
        courier_name: '',
        description: '',
        cost: ''
    })

    const openModal = (rate?: ShippingRate) => {
        if (rate) {
            setEditingRate(rate)
            setFormData({
                courier_name: rate.courier_name,
                description: rate.description || '',
                cost: String(rate.cost)
            })
        } else {
            setEditingRate(null)
            setFormData({ courier_name: '', description: '', cost: '' })
        }
        setIsModalOpen(true)
    }

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, courierFilter, costFilter])

    const filteredRates = useMemo(() => {
        let result = initialRates

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(rate =>
                rate.courier_name.toLowerCase().includes(lowerSearch) ||
                rate.description.toLowerCase().includes(lowerSearch)
            )
        }

        // Filter by courier
        if (courierFilter !== 'all') {
            result = result.filter(rate => rate.courier_name === courierFilter)
        }

        // Filter by cost range
        if (costFilter.min) {
            result = result.filter(rate => rate.cost >= Number(costFilter.min))
        }
        if (costFilter.max) {
            result = result.filter(rate => rate.cost <= Number(costFilter.max))
        }

        return result
    }, [initialRates, searchTerm, courierFilter, costFilter])

    // Pagination
    const paginatedRates = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredRates.slice(startIndex, endIndex)
    }, [filteredRates, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredRates.length / itemsPerPage)
    const totalItems = filteredRates.length

    // Get unique couriers for filter
    const uniqueCouriers = useMemo(() => {
        const couriers = new Set(initialRates.map(r => r.courier_name))
        return Array.from(couriers).sort()
    }, [initialRates])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shipping rate?')) return

        setIsLoading(true)
        const { error } = await supabase.from('shipping_rates').delete().eq('id', id)
        setIsLoading(false)

        if (error) {
            alert('Error deleting rate: ' + error.message)
        } else {
            router.refresh()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            courier_name: formData.courier_name,
            description: formData.description,
            cost: Number(formData.cost)
        }

        let error
        if (editingRate) {
            const { error: updateError } = await supabase
                .from('shipping_rates')
                .update(payload)
                .eq('id', editingRate.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('shipping_rates')
                .insert(payload)
            error = insertError
        }

        setIsLoading(false)

        if (error) {
            alert('Error saving rate: ' + error.message)
        } else {
            setIsModalOpen(false)
            router.refresh()
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Shipping Rates (Ongkir)</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Rate
                </button>
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
                                placeholder="Courier or description..."
                                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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

                    {/* Cost Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Cost</label>
                        <input
                            type="number"
                            placeholder="Min cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.min}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Cost</label>
                        <input
                            type="number"
                            placeholder="Max cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.max}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('')
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

                <div className="mt-3 text-sm text-gray-600">
                    Showing {paginatedRates.length} of {totalItems} rates
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedRates.map((rate) => (
                            <tr key={rate.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.courier_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{formatCurrency(rate.cost, config)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(rate)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(rate.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedRates.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    {filteredRates.length === 0 ? 'No shipping rates found.' : 'No shipping rates found for current page.'}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingRate ? 'Edit Rate' : 'Add New Rate'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name (e.g. JNE, GoSend)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.courier_name}
                                    onChange={e => setFormData({ ...formData, courier_name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (e.g. Jabodetabek)</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (IDR)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
                                    {editingRate ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
