'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    TrendingUp, TrendingDown, AlertTriangle, Download,
    ChevronDown, Package, Wallet, BarChart3
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'

type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom'

type ExpenseByCategory = {
    category: string
    total: number
}

type PLData = {
    revenue: number
    cogs: number
    grossProfit: number
    operatingExpenses: number
    expensesByCategory: ExpenseByCategory[]
    netProfit: number
    productsWithoutCost: string[]
}

const PRESET_LABELS: Record<PeriodPreset, string> = {
    this_month: 'Bulan Ini',
    last_month: 'Bulan Lalu',
    last_3_months: '3 Bulan Terakhir',
    this_year: 'Tahun Ini',
    custom: 'Kustom',
}

const CATEGORY_LABELS: Record<string, string> = {
    listrik: 'Listrik',
    internet: 'Internet',
    gaji: 'Gaji Karyawan',
    sewa: 'Sewa Tempat',
    atk: 'Alat Tulis Kantor',
    transportasi: 'Transportasi',
    maintenance: 'Maintenance',
    lainnya: 'Lainnya',
}

function getDateRange(preset: PeriodPreset, custom: { start: string; end: string }): { start: Date; end: Date } {
    const now = new Date()
    switch (preset) {
        case 'this_month':
            return { start: startOfMonth(now), end: endOfMonth(now) }
        case 'last_month': {
            const last = subMonths(now, 1)
            return { start: startOfMonth(last), end: endOfMonth(last) }
        }
        case 'last_3_months': {
            const threeAgo = subMonths(now, 3)
            return { start: startOfMonth(threeAgo), end: endOfMonth(now) }
        }
        case 'this_year':
            return { start: startOfYear(now), end: endOfYear(now) }
        case 'custom':
            return {
                start: custom.start ? new Date(custom.start) : startOfMonth(now),
                end: custom.end ? new Date(custom.end + 'T23:59:59') : endOfMonth(now),
            }
    }
}

export default function ProfitLossReport() {
    const config = useBusinessConfig()
    const fc = (n: number) => formatCurrency(n, config)
    const supabase = createClient()

    const [preset, setPreset] = useState<PeriodPreset>('this_month')
    const [customRange, setCustomRange] = useState({ start: '', end: '' })
    const [data, setData] = useState<PLData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchPL = useCallback(async () => {
        setLoading(true)
        const { start, end } = getDateRange(preset, customRange)
        const startISO = start.toISOString()
        const endISO = end.toISOString()
        const startDate = format(start, 'yyyy-MM-dd')
        const endDate = format(end, 'yyyy-MM-dd')

        try {
            // 1. Revenue: income transactions in period
            const { data: incomeRows } = await supabase
                .from('financial_transactions')
                .select('amount')
                .eq('transaction_type', 'income')
                .gte('transaction_date', startISO)
                .lte('transaction_date', endISO)

            const revenue = (incomeRows || []).reduce((s, r) => s + Number(r.amount), 0)

            // 2. COGS: order_items of paid orders in period, joined with product cost_price
            const { data: paidOrders } = await supabase
                .from('orders')
                .select('id')
                .eq('status', 'paid')
                .gte('date', startDate)
                .lte('date', endDate)

            const paidOrderIds = (paidOrders || []).map(o => o.id)

            let cogs = 0
            const productsWithoutCost: string[] = []

            if (paidOrderIds.length > 0) {
                const { data: items } = await supabase
                    .from('order_items')
                    .select('quantity, products(name, cost_price)')
                    .in('order_id', paidOrderIds)

                for (const item of items || []) {
                    const raw = item.products as unknown
                    const product: { name: string; cost_price: number | null } | null = Array.isArray(raw) ? raw[0] ?? null : (raw as any)
                    if (!product) continue
                    if (product.cost_price == null) {
                        if (!productsWithoutCost.includes(product.name)) {
                            productsWithoutCost.push(product.name)
                        }
                    } else {
                        cogs += item.quantity * product.cost_price
                    }
                }
            }

            // 3. Operating expenses in period
            const { data: expenseRows } = await supabase
                .from('operational_expenses')
                .select('category, amount')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)

            const expenseMap: Record<string, number> = {}
            let operatingExpenses = 0
            for (const row of expenseRows || []) {
                expenseMap[row.category] = (expenseMap[row.category] || 0) + Number(row.amount)
                operatingExpenses += Number(row.amount)
            }

            const expensesByCategory: ExpenseByCategory[] = Object.entries(expenseMap)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total)

            const grossProfit = revenue - cogs
            const netProfit = grossProfit - operatingExpenses

            setData({
                revenue,
                cogs,
                grossProfit,
                operatingExpenses,
                expensesByCategory,
                netProfit,
                productsWithoutCost,
            })
        } catch (err) {
            console.error('Error fetching P&L:', err)
        } finally {
            setLoading(false)
        }
    }, [preset, customRange])

    useEffect(() => {
        fetchPL()
    }, [fetchPL])

    const exportCSV = () => {
        if (!data) return
        const { start, end } = getDateRange(preset, customRange)
        const rows = [
            ['Laporan Laba/Rugi'],
            [`Periode: ${format(start, 'd MMMM yyyy', { locale: idLocale })} – ${format(end, 'd MMMM yyyy', { locale: idLocale })}`],
            [],
            ['Komponen', 'Jumlah'],
            ['Pendapatan (Revenue)', data.revenue],
            ['HPP / Harga Pokok', data.cogs],
            ['Laba Kotor', data.grossProfit],
            [],
            ['Biaya Operasional', data.operatingExpenses],
            ...data.expensesByCategory.map(e => [`  • ${CATEGORY_LABELS[e.category] || e.category}`, e.total]),
            [],
            ['Laba / Rugi Bersih', data.netProfit],
        ]
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laba-rugi-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    const { start, end } = getDateRange(preset, customRange)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Laba / Rugi</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {format(start, 'd MMM yyyy', { locale: idLocale })} –{' '}
                        {format(end, 'd MMM yyyy', { locale: idLocale })}
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    disabled={!data || loading}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-40"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Period Selector */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(PRESET_LABELS) as PeriodPreset[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPreset(p)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                preset === p
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {PRESET_LABELS[p]}
                        </button>
                    ))}
                </div>
                {preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Dari</label>
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                    Memuat laporan...
                </div>
            ) : data ? (
                <>
                    {/* Warning: products without cost_price */}
                    {data.productsWithoutCost.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">HPP belum diisi untuk beberapa produk</p>
                                <p className="text-amber-700">
                                    Produk berikut tidak diperhitungkan dalam HPP:{' '}
                                    <span className="font-medium">{data.productsWithoutCost.join(', ')}</span>.
                                    Isi HPP di menu <strong>Products</strong> agar kalkulasi akurat.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Net result banner */}
                    <div className={`rounded-xl p-6 flex items-center justify-between ${
                        data.netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {data.netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                            </p>
                            <p className={`text-3xl font-bold mt-1 ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {fc(Math.abs(data.netProfit))}
                            </p>
                        </div>
                        <div className={`p-4 rounded-full ${data.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {data.netProfit >= 0
                                ? <TrendingUp className="text-green-600" size={32} />
                                : <TrendingDown className="text-red-600" size={32} />
                            }
                        </div>
                    </div>

                    {/* P&L breakdown */}
                    <div className="bg-white rounded-lg shadow divide-y divide-gray-100">

                        {/* Revenue */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Wallet className="text-green-600" size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Pendapatan (Revenue)</p>
                                    <p className="text-xs text-gray-500">Dari order yang sudah lunas</p>
                                </div>
                            </div>
                            <p className="font-bold text-green-700 text-lg">{fc(data.revenue)}</p>
                        </div>

                        {/* COGS */}
                        <div className="p-5 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Package className="text-orange-500" size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">HPP / Harga Pokok</p>
                                    <p className="text-xs text-gray-500">Modal produk yang terjual</p>
                                </div>
                            </div>
                            <p className="font-bold text-orange-600 text-lg">({fc(data.cogs)})</p>
                        </div>

                        {/* Gross profit */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <BarChart3 className="text-blue-600" size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Laba Kotor</p>
                                    <p className="text-xs text-gray-500">Revenue − HPP</p>
                                </div>
                            </div>
                            <p className={`font-bold text-lg ${data.grossProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                {fc(data.grossProfit)}
                            </p>
                        </div>

                        {/* Operating expenses header */}
                        <div className="p-5 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <TrendingDown className="text-red-500" size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Biaya Operasional</p>
                                    <p className="text-xs text-gray-500">Listrik, gaji, sewa, dll</p>
                                </div>
                            </div>
                            <p className="font-bold text-red-600 text-lg">({fc(data.operatingExpenses)})</p>
                        </div>

                        {/* Expense breakdown */}
                        {data.expensesByCategory.length > 0 && (
                            <div className="px-5 pb-4 bg-gray-50">
                                <div className="ml-11 space-y-2 border-l-2 border-gray-200 pl-4">
                                    {data.expensesByCategory.map(e => (
                                        <div key={e.category} className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                {CATEGORY_LABELS[e.category] || e.category}
                                            </span>
                                            <span className="text-gray-700 font-medium">{fc(e.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Net profit — bottom line */}
                        <div className={`p-5 flex items-center justify-between rounded-b-lg ${
                            data.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            <p className="font-bold text-gray-900 text-lg">
                                {data.netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                            </p>
                            <p className={`font-bold text-xl ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {fc(data.netProfit)}
                            </p>
                        </div>
                    </div>

                    {/* Gross margin note */}
                    {data.revenue > 0 && (
                        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-6 text-sm">
                            <div>
                                <p className="text-gray-500">Margin Kotor</p>
                                <p className="font-bold text-gray-900 text-lg">
                                    {((data.grossProfit / data.revenue) * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Margin Bersih</p>
                                <p className={`font-bold text-lg ${data.netProfit / data.revenue >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {((data.netProfit / data.revenue) * 100).toFixed(1)}%
                                </p>
                            </div>
                            {data.cogs > 0 && (
                                <div>
                                    <p className="text-gray-500">Rasio HPP</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {((data.cogs / data.revenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                    Gagal memuat laporan. Coba lagi.
                </div>
            )}
        </div>
    )
}
