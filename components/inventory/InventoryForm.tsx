'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Package } from 'lucide-react'
import { useBusinessConfig } from '@/lib/business-config-context'
import InventoryFilterToolbar from './InventoryFilterToolbar'
import InventoryTable from './InventoryTable'
import InventoryAddModal from './InventoryAddModal'
import InventoryEditModal from './InventoryEditModal'
import InventoryTransactionModal from './InventoryTransactionModal'
import type {
    InventoryItem,
    EditFormData,
    NewItemFormData,
    NewTransactionFormData,
    CostFilter,
} from './types'

export type { InventoryTransaction } from './types'

export default function InventoryForm() {
    const config = useBusinessConfig()
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [showTransactionForm, setShowTransactionForm] = useState(false)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
    const [editFormData, setEditFormData] = useState<EditFormData>({
        name: '',
        category: 'bahan_baku',
        unit: '',
        min_stock: 0,
        unit_cost: 0,
        supplier: '',
        description: '',
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [stockFilter, setStockFilter] = useState<string>('all')
    const [costFilter, setCostFilter] = useState<CostFilter>({ min: '', max: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const supabase = createClient()

    const [newItem, setNewItem] = useState<NewItemFormData>({
        name: '',
        category: 'bahan_baku',
        unit: '',
        current_stock: 0,
        min_stock: 0,
        unit_cost: 0,
        supplier: '',
        description: '',
    })

    const [newTransaction, setNewTransaction] = useState<NewTransactionFormData>({
        inventory_id: '',
        transaction_type: 'in',
        quantity: 0,
        unit_cost: 0,
        reference: '',
        notes: '',
    })

    const fetchItems = useCallback(async () => {
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
    }, [supabase])

    useEffect(() => {
        fetchItems()
    }, [fetchItems])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, categoryFilter, stockFilter, costFilter])

    const filteredItems = useMemo(() => {
        let result = items

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            result = result.filter(
                item =>
                    item.name.toLowerCase().includes(lowerSearch) ||
                    (item.supplier && item.supplier.toLowerCase().includes(lowerSearch)) ||
                    (item.description && item.description.toLowerCase().includes(lowerSearch))
            )
        }

        if (categoryFilter !== 'all') {
            result = result.filter(item => item.category === categoryFilter)
        }

        if (stockFilter !== 'all') {
            result = result.filter(item => {
                if (stockFilter === 'low') return item.current_stock <= item.min_stock
                if (stockFilter === 'normal') return item.current_stock > item.min_stock
                return true
            })
        }

        if (costFilter.min) {
            result = result.filter(item => item.unit_cost >= Number(costFilter.min))
        }
        if (costFilter.max) {
            result = result.filter(item => item.unit_cost <= Number(costFilter.max))
        }

        return result
    }, [items, searchTerm, categoryFilter, stockFilter, costFilter])

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredItems.slice(startIndex, endIndex)
    }, [filteredItems, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
    const totalItems = filteredItems.length

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...newItem,
                name: newItem.name.trim(),
                unit: newItem.unit.trim(),
                supplier: newItem.supplier?.trim() || null,
                description: newItem.description?.trim() || null,
            }
            const { error } = await supabase.from('inventory').insert([payload])
            if (error) throw error

            setNewItem({
                name: '',
                category: 'bahan_baku',
                unit: '',
                current_stock: 0,
                min_stock: 0,
                unit_cost: 0,
                supplier: '',
                description: '',
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
        if (newTransaction.quantity <= 0) {
            alert('Quantity transaksi harus lebih dari 0')
            return
        }
        setLoading(true)

        try {
            const selectedItem = items.find(item => item.id === newTransaction.inventory_id)
            const unitCost = newTransaction.unit_cost || selectedItem?.unit_cost || 0
            const rawCost = newTransaction.quantity * unitCost
            const totalCost = Number(rawCost.toFixed(2))

            const { error } = await supabase.from('inventory_transactions').insert([
                {
                    ...newTransaction,
                    reference: newTransaction.reference.trim() || null,
                    notes: newTransaction.notes.trim() || null,
                    total_cost: totalCost,
                },
            ])

            if (error) throw error

            setNewTransaction({
                inventory_id: '',
                transaction_type: 'in',
                quantity: 0,
                unit_cost: 0,
                reference: '',
                notes: '',
            })
            setShowTransactionForm(false)
            fetchItems()
        } catch (error) {
            console.error('Error adding transaction:', error)
        } finally {
            setLoading(false)
        }
    }

    const openEdit = (item: InventoryItem) => {
        setEditingItem(item)
        setEditFormData({
            name: item.name,
            category: item.category,
            unit: item.unit,
            min_stock: item.min_stock,
            unit_cost: item.unit_cost,
            supplier: item.supplier ?? '',
            description: item.description ?? '',
        })
    }

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('inventory')
                .update({
                    name: editFormData.name,
                    category: editFormData.category,
                    unit: editFormData.unit,
                    min_stock: editFormData.min_stock,
                    unit_cost: editFormData.unit_cost,
                    supplier: editFormData.supplier || null,
                    description: editFormData.description || null,
                })
                .eq('id', editingItem.id)

            if (error) throw error

            setEditingItem(null)
            fetchItems()
        } catch (error) {
            console.error('Error updating inventory item:', error)
            alert('Gagal menyimpan: ' + (error instanceof Error ? error.message : 'unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (item: InventoryItem) => {
        if (!confirm(`Hapus item "${item.name}"?\n\nPerhatian: item tidak bisa dihapus jika sedang dipakai dalam resep.`)) return
        setLoading(true)
        try {
            const { error } = await supabase.from('inventory').delete().eq('id', item.id)
            if (error) {
                if (error.code === '23503') {
                    alert(`Tidak bisa menghapus "${item.name}" karena item ini digunakan dalam resep. Hapus bahan dari resep terlebih dahulu.`)
                } else {
                    alert('Gagal hapus: ' + error.message)
                }
                return
            }
            fetchItems()
        } catch (error) {
            alert('Gagal hapus: ' + (error instanceof Error ? error.message : 'unknown error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTransactionForm(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition cursor-pointer"
                    >
                        <Package size={18} /> Add Transaction
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition cursor-pointer"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <InventoryFilterToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                costFilter={costFilter}
                setCostFilter={setCostFilter}
                setCurrentPage={setCurrentPage}
                paginatedCount={paginatedItems.length}
                totalCount={totalItems}
            />

            {/* Inventory Table */}
            <InventoryTable
                paginatedItems={paginatedItems}
                filteredCount={filteredItems.length}
                config={config}
                openEdit={openEdit}
                handleDeleteItem={handleDeleteItem}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
            />

            {/* Add Item Modal */}
            <InventoryAddModal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                newItem={newItem}
                setNewItem={setNewItem}
                onSubmit={handleAddItem}
                loading={loading}
            />

            {/* Transaction Modal */}
            <InventoryTransactionModal
                isOpen={showTransactionForm}
                onClose={() => setShowTransactionForm(false)}
                items={items}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                onSubmit={handleAddTransaction}
                loading={loading}
            />

            {/* Edit Item Modal */}
            <InventoryEditModal
                editingItem={editingItem}
                onClose={() => setEditingItem(null)}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                onSubmit={handleUpdateItem}
                loading={loading}
            />
        </div>
    )
}
