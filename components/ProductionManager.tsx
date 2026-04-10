'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Plus, X, Loader2, Factory, CheckCircle,
    Clock, PlayCircle, AlertTriangle, Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

type Recipe = {
    id: string
    name: string
    yield_quantity: number
    yield_unit: string
}

type IngredientPreview = {
    quantity: number
    inventory: { name: string; unit: string; current_stock: number } | null
}

type ProductionRun = {
    id: string
    recipe_id: string
    quantity_batches: number
    date: string
    status: 'planned' | 'in_progress' | 'completed'
    notes: string | null
    recipes: {
        name: string
        yield_quantity: number
        yield_unit: string
        recipe_ingredients: IngredientPreview[]
    } | null
}

type StatusFilter = 'all' | 'planned' | 'in_progress' | 'completed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ProductionRun['status'], string> = {
    planned: 'Rencana',
    in_progress: 'Proses',
    completed: 'Selesai',
}

const STATUS_COLOR: Record<ProductionRun['status'], string> = {
    planned: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
}

const STATUS_ICON: Record<ProductionRun['status'], React.ReactNode> = {
    planned: <Clock size={12} />,
    in_progress: <PlayCircle size={12} />,
    completed: <CheckCircle size={12} />,
}

const NEXT_STATUS: Partial<Record<ProductionRun['status'], ProductionRun['status']>> = {
    planned: 'in_progress',
    in_progress: 'completed',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductionManager({ initialRecipes }: { initialRecipes: Recipe[] }) {
    const supabase = createClient()
    const recipes = initialRecipes

    const [runs, setRuns] = useState<ProductionRun[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

    // Confirm-complete modal
    const [confirmRun, setConfirmRun] = useState<ProductionRun | null>(null)
    const [completing, setCompleting] = useState(false)

    // Create form modal
    const [formOpen, setFormOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        recipe_id: '',
        quantity_batches: '1',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    })

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchRuns = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('production_runs')
            .select(`
                *,
                recipes(
                    name, yield_quantity, yield_unit,
                    recipe_ingredients(
                        quantity,
                        inventory(name, unit, current_stock)
                    )
                )
            `)
            .order('date', { ascending: false })
        setRuns((data as ProductionRun[]) ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchRuns() }, [fetchRuns])

    const filteredRuns = statusFilter === 'all'
        ? runs
        : runs.filter(r => r.status === statusFilter)

    // ── Create ───────────────────────────────────────────────────────────────

    const openCreate = () => {
        setFormData({
            recipe_id: recipes[0]?.id ?? '',
            quantity_batches: '1',
            date: new Date().toISOString().split('T')[0],
            notes: '',
        })
        setFormOpen(true)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.recipe_id) { alert('Pilih resep terlebih dahulu'); return }
        setSaving(true)
        const { error } = await supabase.from('production_runs').insert({
            recipe_id: formData.recipe_id,
            quantity_batches: Number(formData.quantity_batches),
            date: formData.date,
            notes: formData.notes || null,
            status: 'planned',
        })
        setSaving(false)
        if (error) { alert('Gagal membuat run: ' + error.message); return }
        setFormOpen(false)
        await fetchRuns()
    }

    // ── Status update ────────────────────────────────────────────────────────

    const handleAdvanceStatus = async (run: ProductionRun) => {
        const next = NEXT_STATUS[run.status]
        if (!next) return

        // Completion needs confirmation + inventory check
        if (next === 'completed') {
            setConfirmRun(run)
            return
        }

        const { error } = await supabase
            .from('production_runs')
            .update({ status: next })
            .eq('id', run.id)
        if (error) { alert('Gagal update status: ' + error.message); return }
        await fetchRuns()
    }

    const handleConfirmComplete = async () => {
        if (!confirmRun) return
        setCompleting(true)
        const { error } = await supabase
            .from('production_runs')
            .update({ status: 'completed' })
            .eq('id', confirmRun.id)
        setCompleting(false)
        if (error) { alert('Gagal menyelesaikan produksi: ' + error.message); return }
        setConfirmRun(null)
        await fetchRuns()
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (run: ProductionRun) => {
        if (run.status === 'completed') {
            alert('Run yang sudah selesai tidak dapat dihapus karena sudah mengurangi stok inventory.')
            return
        }
        if (!confirm(`Hapus run produksi "${run.recipes?.name}"?`)) return
        const { error } = await supabase.from('production_runs').delete().eq('id', run.id)
        if (error) { alert('Gagal hapus: ' + error.message); return }
        await fetchRuns()
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produksi</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Catat sesi produksi — stok bahan otomatis dikurangi saat selesai
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={recipes.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-40"
                >
                    <Plus size={18} /> Buat Run
                </button>
            </div>

            {recipes.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-sm text-amber-800">
                        Belum ada resep. Buat resep di menu <strong>Resep & HPP</strong> terlebih dahulu.
                    </p>
                </div>
            )}

            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'planned', 'in_progress', 'completed'] as StatusFilter[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            statusFilter === s
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {s === 'all' ? 'Semua' : STATUS_LABEL[s as ProductionRun['status']]}
                    </button>
                ))}
            </div>

            {/* Production runs table */}
            {loading ? (
                <div className="text-center py-16 text-gray-400">Memuat data...</div>
            ) : filteredRuns.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-16 text-center">
                    <Factory className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">Belum ada run produksi</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resep</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimasi Hasil</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRuns.map(run => {
                                const recipe = run.recipes
                                const estimatedYield = recipe
                                    ? run.quantity_batches * recipe.yield_quantity
                                    : null
                                const nextStatus = NEXT_STATUS[run.status]
                                return (
                                    <tr key={run.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                                            {format(new Date(run.date), 'd MMM yyyy', { locale: idLocale })}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-gray-900">
                                            {recipe?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {run.quantity_batches}×
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {estimatedYield != null
                                                ? `${estimatedYield} ${recipe?.yield_unit}`
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[run.status]}`}>
                                                {STATUS_ICON[run.status]}
                                                {STATUS_LABEL[run.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {nextStatus && (
                                                    <button
                                                        onClick={() => handleAdvanceStatus(run)}
                                                        className={`text-xs px-2.5 py-1 rounded font-medium ${
                                                            nextStatus === 'completed'
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        }`}
                                                    >
                                                        {nextStatus === 'in_progress' ? 'Mulai' : 'Selesaikan'}
                                                    </button>
                                                )}
                                                {run.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleDelete(run)}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Confirm Complete Modal ────────────────────────────────────────────── */}
            {confirmRun && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Selesaikan Produksi?</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Stok inventory akan dikurangi otomatis
                            </p>
                        </div>

                        <div className="px-6 py-4 space-y-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                <p className="font-medium text-gray-800">{confirmRun.recipes?.name}</p>
                                <p className="text-gray-500 mt-0.5">
                                    {confirmRun.quantity_batches} batch ×{' '}
                                    {format(new Date(confirmRun.date), 'd MMM yyyy', { locale: idLocale })}
                                </p>
                            </div>

                            {/* Inventory deduction preview */}
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    Bahan yang akan dikurangi:
                                </p>
                                {(confirmRun.recipes?.recipe_ingredients ?? []).length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Tidak ada bahan terdaftar</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {(confirmRun.recipes?.recipe_ingredients ?? []).map((ing, i) => {
                                            const needed = ing.quantity * confirmRun.quantity_batches
                                            const stock = ing.inventory?.current_stock ?? 0
                                            const insufficient = stock < needed
                                            return (
                                                <div key={i} className={`flex justify-between text-sm p-2 rounded ${insufficient ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                                    <span className="text-gray-700">{ing.inventory?.name ?? '?'}</span>
                                                    <span className={`font-medium ${insufficient ? 'text-red-700' : 'text-gray-800'}`}>
                                                        −{needed} {ing.inventory?.unit}
                                                        {insufficient && (
                                                            <span className="ml-1.5 text-xs text-red-500">
                                                                (stok: {stock})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {(confirmRun.recipes?.recipe_ingredients ?? []).some(
                                ing => (ing.inventory?.current_stock ?? 0) < ing.quantity * confirmRun.quantity_batches
                            ) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-amber-800">
                                        Beberapa bahan mungkin tidak cukup. Stok bisa menjadi negatif.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-5 flex gap-3">
                            <button
                                onClick={() => setConfirmRun(null)}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                disabled={completing}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {completing && <Loader2 className="animate-spin" size={16} />}
                                Ya, Selesaikan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Form Modal ─────────────────────────────────────────────────── */}
            {formOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Buat Run Produksi</h2>
                            <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Resep <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.recipe_id}
                                    onChange={e => setFormData(d => ({ ...d, recipe_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Pilih resep...</option>
                                    {recipes.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (yield: {r.yield_quantity} {r.yield_unit}/batch)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah Batch <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        value={formData.quantity_batches}
                                        onChange={e => setFormData(d => ({ ...d, quantity_batches: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Produksi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData(d => ({ ...d, date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Estimated yield preview */}
                            {formData.recipe_id && formData.quantity_batches && (() => {
                                const r = recipes.find(r => r.id === formData.recipe_id)
                                if (!r) return null
                                const total = Number(formData.quantity_batches) * r.yield_quantity
                                return (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
                                        Estimasi hasil: <strong>{total} {r.yield_unit}</strong>
                                    </div>
                                )
                            })()}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    Buat Run
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
