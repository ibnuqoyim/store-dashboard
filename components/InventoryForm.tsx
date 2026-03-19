'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Save, Package, Wheat, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

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
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [stockFilter, setStockFilter] = useState<string>('all')
    const [costFilter, setCostFilter] = useState({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
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

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, categoryFilter, stockFilter, costFilter])

    const filteredItems = useMemo(() => {
        let result = items

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(item =>
                item.name.toLowerCase().includes(lowerSearch) ||
                (item.supplier && item.supplier.toLowerCase().includes(lowerSearch)) ||
                (item.description && item.description.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by category
        if (categoryFilter !== 'all') {
            result = result.filter(item => item.category === categoryFilter)
        }

        // Filter by stock status
        if (stockFilter !== 'all') {
            result = result.filter(item => {
                if (stockFilter === 'low') return item.current_stock <= item.min_stock
                if (stockFilter === 'normal') return item.current_stock > item.min_stock
                return true
            })
        }

        // Filter by cost range
        if (costFilter.min) {
            result = result.filter(item => item.unit_cost >= Number(costFilter.min))
        }
        if (costFilter.max) {
            result = result.filter(item => item.unit_cost <= Number(costFilter.max))
        }

        return result
    }, [items, searchTerm, categoryFilter, stockFilter, costFilter])

    // Pagination
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredItems.slice(startIndex, endIndex)
    }, [filteredItems, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
    const totalItems = filteredItems.length

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
            return { text: 'Low Stock', color: 'text-red-600 bg-red-100' }
        }
        return { text: 'In Stock', color: 'text-green-600 bg-green-100' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTransactionForm(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition"
                    >
                        <Package size={18} /> Add Transaction
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
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
                                placeholder="Item name, supplier..."
                                className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="bahan_baku">Bahan Baku</option>
                            <option value="packaging">Packaging</option>
                        </select>
                    </div>

                    {/* Stock Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                        >
                            <option value="all">All Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="normal">Normal Stock</option>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Unit Cost</label>
                        <input
                            type="number"
                            placeholder="Min unit cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.min}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Unit Cost</label>
                        <input
                            type="number"
                            placeholder="Max unit cost"
                            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={costFilter.max}
                            onChange={(e) => setCostFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {paginatedItems.length} of {totalItems} items
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setCategoryFilter('all')
                            setStockFilter('all')
                            setCostFilter({ min: '', max: '' })
                            setCurrentPage(1)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear all filters
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
                        {paginatedItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    {filteredItems.length === 0 ? 'No items found.' : 'No items found for current page.'}
                                </td>
                            </tr>
                        ) : (
                            paginatedItems.map((item) => {
                                const stockStatus = getStockStatus(item)
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
                                                {stockStatus.text === 'Low Stock' && <AlertTriangle size={12} />}
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
