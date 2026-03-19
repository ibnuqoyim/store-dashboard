
'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'

type Product = {
    id: string
    name: string
    price: number
    weight: number | null
    dough_id: string | null
    adonan?: { name: string } | null
    image_url: string | null
    is_active: boolean
    is_ready: boolean
}

type Dough = {
    id: string
    name: string
}

export default function ProductList({ initialProducts, doughs }: { initialProducts: Product[], doughs: Dough[] }) {
    const [products] = useState<Product[]>(initialProducts)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [readyFilter, setReadyFilter] = useState<string>('all')
    const [doughFilter, setDoughFilter] = useState<string>('all')
    const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const router = useRouter()
    const supabase = createClient()

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, readyFilter, doughFilter, priceFilter])

    const filteredProducts = useMemo(() => {
        let result = products

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                (p.adonan?.name && p.adonan.name.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(p => p.is_active === (statusFilter === 'active'))
        }

        // Filter by ready status
        if (readyFilter !== 'all') {
            result = result.filter(p => p.is_ready === (readyFilter === 'ready'))
        }

        // Filter by dough
        if (doughFilter !== 'all') {
            result = result.filter(p => p.dough_id === doughFilter)
        }

        // Filter by price range
        if (priceFilter.min) {
            result = result.filter(p => p.price >= Number(priceFilter.min))
        }
        if (priceFilter.max) {
            result = result.filter(p => p.price <= Number(priceFilter.max))
        }

        return result
    }, [products, searchTerm, statusFilter, readyFilter, doughFilter, priceFilter])

    // Pagination
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredProducts.slice(startIndex, endIndex)
    }, [filteredProducts, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const totalItems = filteredProducts.length

    // Function to resize Cloudinary images
    const getResizedImageUrl = (imageUrl: string | null, width: number = 40, height: number = 40) => {
        if (!imageUrl) return null
        
        // Check if it's a Cloudinary URL
        if (imageUrl.includes('cloudinary.com')) {
            // Extract the base URL and add transformation parameters
            const urlParts = imageUrl.split('/upload/')
            if (urlParts.length === 2) {
                return `${urlParts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${urlParts[1]}`
            }
        }
        
        return imageUrl
    }
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        weight: '',
        dough_id: '',
        image_url: '',
        is_active: true,
        is_ready: false
    })

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                name: product.name,
                price: String(product.price),
                weight: product.weight ? String(product.weight) : '',
                dough_id: product.dough_id || '',
                image_url: product.image_url || '',
                is_active: product.is_active,
                is_ready: product.is_ready
            })
        } else {
            setEditingProduct(null)
            setFormData({ name: '', price: '', weight: '', dough_id: '', image_url: '', is_active: true, is_ready: false })
        }
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        setIsLoading(true)
        const { error } = await supabase.from('products').delete().eq('id', id)
        setIsLoading(false)

        if (error) {
            alert('Error deleting product')
        } else {
            router.refresh()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            name: formData.name,
            price: Number(formData.price),
            weight: formData.weight ? Number(formData.weight) : null,
            dough_id: formData.dough_id || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            is_ready: formData.is_ready
        }

        let error
        if (editingProduct) {
            const { error: updateError } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editingProduct.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('products')
                .insert(payload)
            error = insertError
        }

        setIsLoading(false)

        if (error) {
            alert('Error saving product: ' + error.message)
        } else {
            setIsModalOpen(false)
            router.refresh()
        }
    }

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Products</h1>
                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Product
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
                                placeholder="Product name or dough..."
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Ready Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ready Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={readyFilter}
                            onChange={(e) => setReadyFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="ready">Ready</option>
                            <option value="not_ready">Not Ready</option>
                        </select>
                    </div>

                    {/* Dough Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dough</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={doughFilter}
                            onChange={(e) => setDoughFilter(e.target.value)}
                        >
                            <option value="all">All Dough</option>
                            {doughs.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Price Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                        <input
                            type="number"
                            placeholder="Min price"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={priceFilter.min}
                            onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                        <input
                            type="number"
                            placeholder="Max price"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={priceFilter.max}
                            onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                    </div>
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

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {paginatedProducts.length} of {totalItems} products
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('all')
                            setReadyFilter('all')
                            setDoughFilter('all')
                            setPriceFilter({ min: '', max: '' })
                            setCurrentPage(1)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dough</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (gr)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ready</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRupiah(product.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.adonan?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.weight || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.image_url ? (
                                        <img 
                                            src={getResizedImageUrl(product.image_url, 40, 40) || product.image_url} 
                                            alt={product.name} 
                                            className="h-10 w-10 object-cover rounded" 
                                        />
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.is_active ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.is_ready ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openModal(product)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedProducts.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                    {filteredProducts.length === 0 ? 'No products found.' : 'No products found for current page.'}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-500">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (IDR)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dough Type</label>
                                    <select
                                        value={formData.dough_id}
                                        onChange={e => setFormData({ ...formData, dough_id: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">None</option>
                                        {doughs.map(dough => (
                                            <option key={dough.id} value={dough.id}>{dough.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (gr)</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <CldUploadWidget
                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products'}
                                                onSuccess={(result: any) => {
                                                    setFormData({ ...formData, image_url: result.info.secure_url })
                                                }}
                                            >
                                                {({ open }) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => open()}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                                                    >
                                                        {formData.image_url ? 'Change Image' : 'Upload Image'}
                                                    </button>
                                                )}
                                            </CldUploadWidget>
                                            {formData.image_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {formData.image_url && (
                                            <div className="mt-2">
                                                <img 
                                                    src={getResizedImageUrl(formData.image_url, 128, 128) || formData.image_url} 
                                                    alt="Product Preview" 
                                                    className="h-32 w-32 object-cover rounded border border-gray-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 mt-2">
                                    <label className="flex items-center text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2">Active</span>
                                    </label>

                                    <label className="flex items-center text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_ready}
                                            onChange={e => setFormData({ ...formData, is_ready: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2">Ready</span>
                                    </label>
                                </div>
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
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
