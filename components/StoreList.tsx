'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Loader2, Store, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type StoreItem = {
    id: string
    name: string
    description: string | null
    is_active: boolean
    created_at: string
}

const emptyForm = { name: '', description: '', is_active: true }

export default function StoreList({ initialStores }: { initialStores: StoreItem[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStore, setEditingStore] = useState<StoreItem | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const router = useRouter()
    const supabase = createClient()

    const openModal = (store?: StoreItem) => {
        if (store) {
            setEditingStore(store)
            setForm({
                name: store.name,
                description: store.description ?? '',
                is_active: store.is_active,
            })
        } else {
            setEditingStore(null)
            setForm(emptyForm)
        }
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus toko ini? Data orders/produk/batch yang tertaut akan kehilangan referensinya.')) return
        setIsLoading(true)
        const { error } = await supabase.from('stores').delete().eq('id', id)
        setIsLoading(false)
        if (error) alert('Error: ' + error.message)
        else router.refresh()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            is_active: form.is_active,
        }

        let error
        if (editingStore) {
            ;({ error } = await supabase.from('stores').update(payload).eq('id', editingStore.id))
        } else {
            ;({ error } = await supabase.from('stores').insert(payload))
        }

        setIsLoading(false)
        if (error) alert('Gagal menyimpan: ' + error.message)
        else {
            setIsModalOpen(false)
            router.refresh()
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola toko/cabang. Setiap bot dapat dikonfigurasi untuk satu toko.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Tambah Toko
                </button>
            </div>

            {initialStores.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Belum ada toko</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Tambah toko pertama kamu, lalu hubungkan ke bot di halaman Bot Config.
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
                    >
                        Tambah Toko
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {initialStores.map(store => (
                                <tr key={store.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/stores/${store.id}`} className="flex items-center gap-2 group">
                                            <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{store.name}</span>
                                            <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400" />
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {store.description ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            store.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {store.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/stores/${store.id}`}
                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                title="Edit detail"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(store.id)}
                                                disabled={isLoading}
                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingStore ? 'Edit Toko' : 'Tambah Toko'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Toko <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="mis: Toko Utama, Cabang BSD"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi
                                    <span className="ml-1 text-xs text-gray-400 font-normal">opsional</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="mis: Toko di Jl. Sudirman No.1"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">Toko aktif</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
                                    {editingStore ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
