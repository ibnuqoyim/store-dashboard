'use client'

import React from 'react'
import { X, Loader2 } from 'lucide-react'
import type { InventoryItem, EditFormData } from './types'

interface InventoryEditModalProps {
    editingItem: InventoryItem | null
    onClose: () => void
    editFormData: EditFormData
    setEditFormData: React.Dispatch<React.SetStateAction<EditFormData>>
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
}

export default function InventoryEditModal({
    editingItem,
    onClose,
    editFormData,
    setEditFormData,
    onSubmit,
    loading,
}: InventoryEditModalProps) {
    if (!editingItem) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-bold text-gray-800">Edit Item Inventory</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={22} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                        <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            value={editFormData.category}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value as 'bahan_baku' | 'packaging' }))}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="bahan_baku">Bahan Baku</option>
                            <option value="packaging">Packaging</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                            <input
                                type="text"
                                required
                                value={editFormData.unit}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="kg, pcs, liter"
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={editFormData.unit_cost}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Stok
                            <span className="ml-1 text-xs text-gray-400 font-normal">
                                (stok saat ini: {editingItem.current_stock} {editingItem.unit} — ubah via transaksi)
                            </span>
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={editFormData.min_stock}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, min_stock: Number(e.target.value) }))}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <input
                            type="text"
                            value={editFormData.supplier}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, supplier: e.target.value }))}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <textarea
                            rows={2}
                            value={editFormData.description}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Simpan Perubahan
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
