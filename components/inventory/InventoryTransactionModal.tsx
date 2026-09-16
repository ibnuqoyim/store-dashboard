'use client'

import React from 'react'
import type { InventoryItem, NewTransactionFormData } from './types'

interface InventoryTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    items: InventoryItem[]
    newTransaction: NewTransactionFormData
    setNewTransaction: React.Dispatch<React.SetStateAction<NewTransactionFormData>>
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
}

export default function InventoryTransactionModal({
    isOpen,
    onClose,
    items,
    newTransaction,
    setNewTransaction,
    onSubmit,
    loading,
}: InventoryTransactionModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Tambah Transaksi</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                        <select
                            required
                            value={newTransaction.inventory_id}
                            onChange={(e) => setNewTransaction({ ...newTransaction, inventory_id: e.target.value })}
                            className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Pilih Item</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.category})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</label>
                        <select
                            value={newTransaction.transaction_type}
                            onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value as 'in' | 'out' })}
                            className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="in">Masuk</option>
                            <option value="out">Keluar</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={newTransaction.quantity}
                                onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: Math.max(0, Number(e.target.value) || 0) }))}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={newTransaction.unit_cost}
                                onChange={(e) => setNewTransaction(prev => ({ ...prev, unit_cost: Math.max(0, Number(e.target.value) || 0) }))}
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referensi</label>
                        <input
                            type="text"
                            value={newTransaction.reference}
                            onChange={(e) => setNewTransaction({ ...newTransaction, reference: e.target.value })}
                            placeholder="Invoice/supplier"
                            className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={newTransaction.notes}
                            onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
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
