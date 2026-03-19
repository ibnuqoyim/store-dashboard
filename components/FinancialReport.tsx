'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'

type FinancialTransaction = {
    id: string
    order_id?: string
    transaction_type: 'income' | 'expense'
    amount: number
    description: string
    transaction_date: string
    created_at: string
    orders?: {
        invoice_number: string
        customer_name: string
    }
}

export default function FinancialReport() {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState({
        start: '',
        end: ''
    })
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()
    }, [dateFilter, typeFilter])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('financial_transactions')
                .select(`
                    *,
                    orders (
                        invoice_number,
                        customer_name
                    )
                `)
                .order('transaction_date', { ascending: false })

            // Apply date filter
            if (dateFilter.start) {
                query = query.gte('transaction_date', dateFilter.start)
            }
            if (dateFilter.end) {
                query = query.lte('transaction_date', dateFilter.end + 'T23:59:59')
            }

            // Apply type filter
            if (typeFilter !== 'all') {
                query = query.eq('transaction_type', typeFilter)
            }

            const { data, error } = await query

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateTotals = () => {
        const income = transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const expense = transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0)

        return { income, expense, net: income - expense }
    }

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const exportToCSV = () => {
        const headers = ['Tanggal', 'Tipe', 'Jumlah', 'Deskripsi', 'Invoice', 'Customer']
        const rows = transactions.map(t => [
            format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            t.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            formatRupiah(Number(t.amount)),
            t.description,
            t.orders?.invoice_number || '',
            t.orders?.customer_name || ''
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `laporan-keuangan-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const totals = calculateTotals()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
                    <p className="text-gray-600">Pantau pemasukan dan pengeluaran bisnis Anda</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatRupiah(totals.income)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                            <p className="text-2xl font-bold text-red-600">
                                {formatRupiah(totals.expense)}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <TrendingDown className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Netto</p>
                            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatRupiah(totals.net)}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${totals.net >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                            <DollarSign className={totals.net >= 0 ? 'text-blue-600' : 'text-red-600'} size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} />
                    <h3 className="font-semibold">Filter</h3>
                </div>
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
                            Tipe Transaksi
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua</option>
                            <option value="income">Pemasukan</option>
                            <option value="expense">Pengeluaran</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Transaksi</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipe
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jumlah
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Deskripsi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada transaksi ditemukan
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(transaction.transaction_date), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            transaction.transaction_type === 'income' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {transaction.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatRupiah(Number(transaction.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {transaction.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                        {transaction.orders?.invoice_number || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.orders?.customer_name || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
