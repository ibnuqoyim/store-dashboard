'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Save, Package, Wheat, AlertTriangle } from 'lucide-react'

type InventoryItem = {
    id: string
    name: string
    category: 'bahan_baku' | 'packaging'
    unit: string
    current_stock: number
    min_stock: number
    unit_cost: number
    supplier?: string
    description?: string
}

type InventoryTransaction = {
    inventory_id: string
    transaction_type: 'in' | 'out'
    quantity: number
    unit_cost?: number
    total_cost?: number
    reference?: string
    notes?: string
}

export default function InventoryForm() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [showTransactionForm, setShowTransactionForm] = useState(false)
    const supabase = createClient()

    const [newItem, setNewItem] = useState({
        name: '',
        category: 'bahan_baku' as 'bahan_baku' | 'packaging',
        unit: '',
        current_stock: 0,
        min_stock: 0,
        unit_cost: 0,
        supplier: '',
        description: ''
    })

    const [newTransaction, setNewTransaction] = useState({
        inventory_id: '',
        transaction_type: 'in' as 'in' | 'out',
        quantity: 0,
        unit_cost: 0,
        reference: '',
        notes: ''
    })

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .order('name')

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching inventory items:', error)
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('inventory')
                .insert([newItem])

            if (error) throw error

            setNewItem({
                name: '',
                category: 'bahan_baku',
                unit: '',
                current_stock: 0,
                min_stock: 0,
                unit_cost: 0,
                supplier: '',
                description: ''
            })
            setShowAddForm(false)
            fetchItems()
        } catch (error) {
            console.error('Error adding inventory item:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const selectedItem = items.find(item => item.id === newTransaction.inventory_id)
            const totalCost = newTransaction.quantity * (newTransaction.unit_cost || selectedItem?.unit_cost || 0)

            const { error } = await supabase
                .from('inventory_transactions')
                .insert([{
                    ...newTransaction,
                    total_cost: totalCost
                }])

            if (error) throw error

            setNewTransaction({
                inventory_id: '',
                transaction_type: 'in',
                quantity: 0,
                unit_cost: 0,
                reference: '',
                notes: ''
            })
            setShowTransactionForm(false)
            fetchItems()
        } catch (error) {
            console.error('Error adding transaction:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getStockStatus = (item: InventoryItem) => {
        if (item.current_stock <= item.min_stock) {
            return { color: 'text-red-600 bg-red-100', icon: AlertTriangle, text: 'Stok Rendah' }
        }
        return { color: 'text-green-600 bg-green-100', icon: Package, text: 'Stok Aman' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600">Kelola bahan baku dan packaging</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTransactionForm(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Transaksi
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        <Plus size={18} />
                        Item Baru
                    </button>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg text-gray-700 font-bold mb-4">Tambah Item Baru</h2>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="bahan_baku">Bahan Baku</option>
                                    <option value="packaging">Packaging</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                                        placeholder="kg, pcs, liter"
                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block  text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                                    <input
                                        type="number"
                                        required
                                        value={newItem.unit_cost}
                                        onChange={(e) => setNewItem({...newItem, unit_cost: Number(e.target.value)})}
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
                                        value={newItem.current_stock}
                                        onChange={(e) => setNewItem({...newItem, current_stock: Number(e.target.value)})}
                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label>
                                    <input
                                        type="number"
                                        required
                                        value={newItem.min_stock}
                                        onChange={(e) => setNewItem({...newItem, min_stock: Number(e.target.value)})}
                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <input
                                    type="text"
                                    value={newItem.supplier}
                                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                    rows={3}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showTransactionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Tambah Transaksi</h2>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                                <select
                                    required
                                    value={newTransaction.inventory_id}
                                    onChange={(e) => setNewTransaction({...newTransaction, inventory_id: e.target.value})}
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
                                    onChange={(e) => setNewTransaction({...newTransaction, transaction_type: e.target.value as any})}
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
                                        value={newTransaction.quantity}
                                        onChange={(e) => setNewTransaction({...newTransaction, quantity: Number(e.target.value)})}
                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                                    <input
                                        type="number"
                                        value={newTransaction.unit_cost}
                                        onChange={(e) => setNewTransaction({...newTransaction, unit_cost: Number(e.target.value)})}
                                        className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referensi</label>
                                <input
                                    type="text"
                                    value={newTransaction.reference}
                                    onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                                    placeholder="Invoice/supplier"
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                <textarea
                                    value={newTransaction.notes}
                                    onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                                    rows={3}
                                    className="w-full  text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 text-gray-700 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTransactionForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Items Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Daftar Inventory</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stok
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Harga Satuan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Belum ada item inventory
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const stockStatus = getStockStatus(item)
                                const StatusIcon = stockStatus.icon
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {item.category === 'bahan_baku' ? (
                                                    <Wheat className="h-5 w-5 text-orange-500 mr-2" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-blue-500 mr-2" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.unit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                item.category === 'bahan_baku' 
                                                    ? 'bg-orange-100 text-orange-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {item.category === 'bahan_baku' ? 'Bahan Baku' : 'Packaging'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {item.current_stock} {item.unit}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Min: {item.min_stock} {item.unit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatRupiah(item.unit_cost)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.supplier || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color} flex items-center gap-1`}>
                                                <StatusIcon size={12} />
                                                {stockStatus.text}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
