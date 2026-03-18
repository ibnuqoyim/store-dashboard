
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
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
    const router = useRouter()
    const supabase = createClient()

    // Form State
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
                        {initialProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRupiah(product.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.adonan?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.weight || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover rounded" />
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
                        {initialProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                                                    src={formData.image_url} 
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
