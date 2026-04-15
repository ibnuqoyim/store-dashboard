'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

type POProduct = {
    product_id: string
    products: { name: string; code: string | null } | null
}

type PO = {
    id: string
    name: string
    description: string | null
    created_at: string
    po_list: POProduct[]
}

export default function POList({ initialPOs }: { initialPOs: PO[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPO, setEditingPO] = useState<PO | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })

    const openModal = (po?: PO) => {
        if (po) {
            setEditingPO(po)
            setFormData({
                name: po.name,
                description: po.description || ''
            })
        } else {
            setEditingPO(null)
            setFormData({ name: '', description: '' })
        }
        setIsModalOpen(true)
    }

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, dateFilter])

    const filteredPOs = useMemo(() => {
        let result = initialPOs

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(po =>
                po.name.toLowerCase().includes(lowerSearch) ||
                (po.description && po.description.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by date range
        if (dateFilter.start) {
            result = result.filter(po => new Date(po.created_at) >= new Date(dateFilter.start))
        }
        if (dateFilter.end) {
            result = result.filter(po => new Date(po.created_at) <= new Date(dateFilter.end + 'T23:59:59'))
        }

        // Sort by created_at (newest first)
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [initialPOs, searchTerm, dateFilter])

    // Pagination
    const paginatedPOs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredPOs.slice(startIndex, endIndex)
    }, [filteredPOs, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredPOs.length / itemsPerPage)
    const totalItems = filteredPOs.length

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This might affect orders using this PO.')) return

        setIsLoading(true)
        const { error } = await supabase.from('batch_po').delete().eq('id', id)
        setIsLoading(false)

        if (error) {
            alert('Error deleting PO: ' + error.message)
        } else {
            router.refresh()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            name: formData.name,
            description: formData.description || null
        }

        let error
        if (editingPO) {
            const { error: updateError } = await supabase
                .from('batch_po')
                .update(payload)
                .eq('id', editingPO.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('batch_po')
                .insert(payload)
            error = insertError
        }

        setIsLoading(false)

        if (error) {
            alert('Error saving PO: ' + error.message)
        } else {
            setIsModalOpen(false)
            router.refresh()
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Pre-Orders (PO)</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Pre-Order
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={18} className="text-gray-500" />
                    <h3 className="font-medium text-gray-700">Search & Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="PO name or description..."
                                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
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
                                setDateFilter({ start: '', end: '' })
                                setCurrentPage(1)
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear all filters
                        </button>
                    </div>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                    Showing {paginatedPOs.length} of {totalItems} POs
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk Dibuka</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPOs.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {item.po_list && item.po_list.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {item.po_list.map(pl => (
                                                <span
                                                    key={pl.product_id}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                                    title={pl.products?.name}
                                                >
                                                    {pl.products?.code ?? pl.products?.name ?? '?'}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">Belum ada produk</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedPOs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    {filteredPOs.length === 0 ? 'No PO found.' : 'No PO found for current page.'}
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
                            <h2 className=" text-gray-800 text-xl font-bold">{editingPO ? 'Edit Pre-Order' : 'Add New Pre-Order'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-800 hover:text-gray-900">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PO Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className=" text-gray-800 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., PO-2024-01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className=" text-gray-800 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Pre-Order details..."
                                    rows={3}
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
                                    {editingPO ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
