'use client'

import React from 'react'
import type { NewItemFormData } from './types'

interface InventoryAddModalProps {
    isOpen: boolean
    onClose: () => void
    newItem: NewItemFormData
    setNewItem: React.Dispatch<React.SetStateAction<NewItemFormData>>
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
}

export default function InventoryAddModal({
    isOpen,
    onClose,
    newItem,
    setNewItem,
    onSubmit,
    loading,
}: InventoryAddModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg text-gray-700 font-bold mb-4">Tambah Item Baru</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                        <input
                            type="text"
                            required
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'bahan_baku' | 'packaging' })}
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
                                value={newItem.unit}
                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
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
                                value={newItem.unit_cost}
                                onChange={(e) => setNewItem({ ...newItem, unit_cost: Number(e.target.value) })}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={newItem.current_stock}
                                onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={newItem.min_stock}
                                onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <input
                            type="text"
                            value={newItem.supplier}
                            onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <textarea
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            rows={3}
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 font-medium"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
