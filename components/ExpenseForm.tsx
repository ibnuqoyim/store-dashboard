'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Save, Receipt, Zap, Globe, CreditCard, Building, Users } from 'lucide-react'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'

type OperationalExpense = {
    id: string
    category: string
    amount: number
    description?: string
    expense_date: string
    payment_method?: string
    receipt_number?: string
    notes?: string
    created_at: string
}

const EXPENSE_CATEGORIES = [
    { value: 'listrik', label: 'Listrik', icon: Zap },
    { value: 'internet', label: 'Internet', icon: Globe },
    { value: 'gaji', label: 'Gaji Karyawan', icon: Users },
    { value: 'sewa', label: 'Sewa Tempat', icon: Building },
    { value: 'atk', label: 'Alat Tulis Kantor', icon: Receipt },
    { value: 'transportasi', label: 'Transportasi', icon: Receipt },
    { value: 'maintenance', label: 'Maintenance', icon: Receipt },
    { value: 'lainnya', label: 'Lainnya', icon: Receipt }
]

const PAYMENT_METHODS = ['cash', 'transfer', 'card', 'e-wallet']

export default function ExpenseForm() {
    const config = useBusinessConfig()
    const fc = (n: number) => formatCurrency(n, config)
    const [expenses, setExpenses] = useState<OperationalExpense[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [dateFilter, setDateFilter] = useState({
        start: '',
        end: ''
    })
    const [categoryFilter, setCategoryFilter] = useState('all')
    const supabase = createClient()

    const [newExpense, setNewExpense] = useState({
        category: 'listrik',
        amount: 0,
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        receipt_number: '',
        notes: ''
    })

    useEffect(() => {
        fetchExpenses()
    }, [dateFilter, categoryFilter])

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('operational_expenses')
                .select('*')
                .order('expense_date', { ascending: false })

            // Apply date filter
            if (dateFilter.start) {
                query = query.gte('expense_date', dateFilter.start)
            }
            if (dateFilter.end) {
                query = query.lte('expense_date', dateFilter.end)
            }

            // Apply category filter
            if (categoryFilter !== 'all') {
                query = query.eq('category', categoryFilter)
            }

            const { data, error } = await query

            if (error) throw error
            setExpenses(data || [])
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('operational_expenses')
                .insert([newExpense])

            if (error) throw error

            setNewExpense({
                category: 'listrik',
                amount: 0,
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                receipt_number: '',
                notes: ''
            })
            setShowAddForm(false)
            fetchExpenses()
        } catch (error) {
            console.error('Error adding expense:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return

        try {
            const { error } = await supabase
                .from('operational_expenses')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchExpenses()
        } catch (error) {
            console.error('Error deleting expense:', error)
        }
    }

    const getCategoryInfo = (category: string) => {
        return EXPENSE_CATEGORIES.find(cat => cat.value === category) || EXPENSE_CATEGORIES[7]
    }

    const calculateTotal = () => {
        return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    }

    const exportToCSV = () => {
        const headers = ['Tanggal', 'Kategori', 'Jumlah', 'Deskripsi', 'Metode Pembayaran', 'No. Bukti', 'Catatan']
        const rows = expenses.map(e => [
            e.expense_date,
            getCategoryInfo(e.category).label,
            fc(Number(e.amount)),
            e.description || '',
            e.payment_method || '',
            e.receipt_number || '',
            e.notes || ''
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `pengeluaran-operasional-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengeluaran Operasional</h1>
                    <p className="text-gray-600">Catat semua pengeluaran operasional bisnis</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        <Receipt size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Tambah Pengeluaran
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                        <p className="text-3xl font-bold text-red-600">
                            {fc(calculateTotal())}
                        </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                        <Receipt className="text-red-600" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Filter</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dari Tanggal
                        </label>
                        <input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sampai Tanggal
                        </label>
                        <input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategori
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Kategori</option>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg text-gray-700 font-bold mb-4">Tambah Pengeluaran</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    required
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                    placeholder="Detail pengeluaran"
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpense.expense_date}
                                    onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
                                <select
                                    value={newExpense.payment_method}
                                    onChange={(e) => setNewExpense({...newExpense, payment_method: e.target.value})}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {PAYMENT_METHODS.map(method => (
                                        <option key={method} value={method}>
                                            {method.charAt(0).toUpperCase() + method.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. Bukti</label>
                                <input
                                    type="text"
                                    value={newExpense.receipt_number}
                                    onChange={(e) => setNewExpense({...newExpense, receipt_number: e.target.value})}
                                    placeholder="Nomor receipt/invoice"
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                <textarea
                                    value={newExpense.notes}
                                    onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
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

            {/* Expenses Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Daftar Pengeluaran</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jumlah
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Deskripsi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Metode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                No. Bukti
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    Belum ada pengeluaran
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => {
                                const categoryInfo = getCategoryInfo(expense.category)
                                const CategoryIcon = categoryInfo.icon
                                return (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <CategoryIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">{categoryInfo.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            {fc(Number(expense.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {expense.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}>
                                                {expense.payment_method || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {expense.receipt_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
