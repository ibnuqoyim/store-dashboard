'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Plus, Pencil, Trash2, Copy, X, Loader2, BookOpen,
    ChevronRight, AlertTriangle, RefreshCw, Package,
} from 'lucide-react'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = { id: string; name: string }

type InventoryItem = {
    id: string
    name: string
    unit: string
    unit_cost: number
    category: string
}

type Ingredient = {
    id: string
    recipe_id: string
    inventory_id: string
    quantity: number
    notes: string
    inventory: InventoryItem | null
}

type Recipe = {
    id: string
    product_id: string | null
    name: string
    yield_quantity: number
    yield_unit: string
    labor_cost_per_batch: number
    overhead_cost_per_batch: number
    notes: string
    products: { name: string } | null
    recipe_ingredients: Ingredient[]
}

type HPPResult = {
    materialCost: number
    laborCost: number
    overheadCost: number
    totalPerBatch: number
    hppPerUnit: number
}

type TempIngredient = {
    tempId: string       // client-side only key
    id?: string          // real DB id (set for existing rows)
    inventory_id: string
    quantity: string
    notes: string
}

// ─── HPP calculation ──────────────────────────────────────────────────────────

function computeHPP(recipe: Recipe): HPPResult {
    const materialCost = (recipe.recipe_ingredients ?? []).reduce((sum, ing) => {
        const unitCost = ing.inventory?.unit_cost ?? 0
        return sum + ing.quantity * unitCost
    }, 0)
    const laborCost = recipe.labor_cost_per_batch ?? 0
    const overheadCost = recipe.overhead_cost_per_batch ?? 0
    const totalPerBatch = materialCost + laborCost + overheadCost
    const hppPerUnit = recipe.yield_quantity > 0 ? totalPerBatch / recipe.yield_quantity : 0
    return { materialCost, laborCost, overheadCost, totalPerBatch, hppPerUnit }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecipeManager({
    initialProducts,
    initialInventory,
}: {
    initialProducts: Product[]
    initialInventory: InventoryItem[]
}) {
    const config = useBusinessConfig()
    const fc = (n: number) => formatCurrency(n, config)
    const supabase = createClient()
    const router = useRouter()

    const products = initialProducts
    const inventory = initialInventory

    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState<string | null>(null)
    const [syncingAll, setSyncingAll] = useState(false)

    // HPP detail modal
    const [hppRecipe, setHPPRecipe] = useState<Recipe | null>(null)

    // Form modal
    const [formOpen, setFormOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        product_id: '',
        yield_quantity: '1',
        yield_unit: 'pcs',
        labor_cost_per_batch: '0',
        overhead_cost_per_batch: '0',
        notes: '',
    })
    const [tempIngredients, setTempIngredients] = useState<TempIngredient[]>([])

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchRecipes = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('recipes')
            .select(`
                *,
                products(name),
                recipe_ingredients(
                    id, recipe_id, inventory_id, quantity, notes,
                    inventory(id, name, unit, unit_cost, category)
                )
            `)
            .order('name')
        setRecipes((data as Recipe[]) ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchRecipes() }, [fetchRecipes])

    // ── Form helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setEditingRecipe(null)
        setFormData({
            name: '', product_id: '', yield_quantity: '1', yield_unit: 'pcs',
            labor_cost_per_batch: '0', overhead_cost_per_batch: '0', notes: '',
        })
        setTempIngredients([])
        setFormOpen(true)
    }

    const openEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe)
        setFormData({
            name: recipe.name,
            product_id: recipe.product_id ?? '',
            yield_quantity: String(recipe.yield_quantity),
            yield_unit: recipe.yield_unit,
            labor_cost_per_batch: String(recipe.labor_cost_per_batch),
            overhead_cost_per_batch: String(recipe.overhead_cost_per_batch),
            notes: recipe.notes ?? '',
        })
        setTempIngredients(
            (recipe.recipe_ingredients ?? []).map(ing => ({
                tempId: ing.id,
                id: ing.id,
                inventory_id: ing.inventory_id,
                quantity: String(ing.quantity),
                notes: ing.notes ?? '',
            }))
        )
        setFormOpen(true)
    }

    const addIngredientRow = () => {
        setTempIngredients(prev => [
            ...prev,
            { tempId: `tmp-${Date.now()}`, inventory_id: '', quantity: '', notes: '' },
        ])
    }

    const updateIngredientRow = (tempId: string, field: keyof TempIngredient, value: string) => {
        setTempIngredients(prev =>
            prev.map(ing => ing.tempId === tempId ? { ...ing, [field]: value } : ing)
        )
    }

    const removeIngredientRow = (tempId: string) => {
        setTempIngredients(prev => prev.filter(ing => ing.tempId !== tempId))
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const validIngredients = tempIngredients.filter(
            ing => ing.inventory_id && ing.quantity && Number(ing.quantity) > 0
        )

        try {
            let recipeId: string

            if (editingRecipe) {
                const { error } = await supabase
                    .from('recipes')
                    .update({
                        name: formData.name,
                        product_id: formData.product_id || null,
                        yield_quantity: Number(formData.yield_quantity),
                        yield_unit: formData.yield_unit,
                        labor_cost_per_batch: Number(formData.labor_cost_per_batch),
                        overhead_cost_per_batch: Number(formData.overhead_cost_per_batch),
                        notes: formData.notes || null,
                    })
                    .eq('id', editingRecipe.id)
                if (error) throw error
                recipeId = editingRecipe.id
            } else {
                const { data, error } = await supabase
                    .from('recipes')
                    .insert({
                        name: formData.name,
                        product_id: formData.product_id || null,
                        yield_quantity: Number(formData.yield_quantity),
                        yield_unit: formData.yield_unit,
                        labor_cost_per_batch: Number(formData.labor_cost_per_batch),
                        overhead_cost_per_batch: Number(formData.overhead_cost_per_batch),
                        notes: formData.notes || null,
                    })
                    .select('id')
                    .single()
                if (error) throw error
                recipeId = data.id
            }

            // Sync ingredients: delete all then re-insert
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
            if (validIngredients.length > 0) {
                const { error } = await supabase.from('recipe_ingredients').insert(
                    validIngredients.map(ing => ({
                        recipe_id: recipeId,
                        inventory_id: ing.inventory_id,
                        quantity: Number(ing.quantity),
                        notes: ing.notes || null,
                    }))
                )
                if (error) throw error
            }

            setFormOpen(false)
            await fetchRecipes()
        } catch (err: any) {
            alert('Gagal menyimpan resep: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Duplicate ────────────────────────────────────────────────────────────

    const handleDuplicate = async (recipe: Recipe) => {
        const { data: newRecipe, error: recipeError } = await supabase
            .from('recipes')
            .insert({
                name: `${recipe.name} (Salinan)`,
                product_id: null, // don't link copy to same product
                yield_quantity: recipe.yield_quantity,
                yield_unit: recipe.yield_unit,
                labor_cost_per_batch: recipe.labor_cost_per_batch,
                overhead_cost_per_batch: recipe.overhead_cost_per_batch,
                notes: recipe.notes || null,
            })
            .select('id')
            .single()

        if (recipeError) { alert('Gagal menduplikasi resep: ' + recipeError.message); return }

        if ((recipe.recipe_ingredients ?? []).length > 0) {
            const { error: ingError } = await supabase.from('recipe_ingredients').insert(
                recipe.recipe_ingredients.map(ing => ({
                    recipe_id: newRecipe.id,
                    inventory_id: ing.inventory_id,
                    quantity: ing.quantity,
                    notes: ing.notes || null,
                }))
            )
            if (ingError) { alert('Resep disalin tapi gagal menyalin bahan: ' + ingError.message); }
        }

        await fetchRecipes()
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async (recipe: Recipe) => {
        if (!confirm(`Hapus resep "${recipe.name}"? Aksi ini tidak dapat dibatalkan.`)) return
        const { error } = await supabase.from('recipes').delete().eq('id', recipe.id)
        if (error) { alert('Gagal hapus: ' + error.message); return }
        await fetchRecipes()
    }

    // ── Sync HPP → products.cost_price ───────────────────────────────────────

    const handleSyncAll = async () => {
        const linked = recipes.filter(r => r.product_id)
        if (linked.length === 0) {
            alert('Tidak ada resep yang ditautkan ke produk.')
            return
        }
        if (!confirm(`Sync HPP ke ${linked.length} produk sekaligus?\n\nIni akan mengupdate cost_price semua produk yang sudah ditautkan ke resep.`)) return

        setSyncingAll(true)
        let success = 0
        let failed = 0

        await Promise.all(
            linked.map(async recipe => {
                const { hppPerUnit } = computeHPP(recipe)
                const { error } = await supabase
                    .from('products')
                    .update({ cost_price: Math.round(hppPerUnit) })
                    .eq('id', recipe.product_id!)
                if (error) failed++
                else success++
            })
        )

        setSyncingAll(false)
        router.refresh()
        alert(`Sync selesai: ${success} produk berhasil diupdate${failed > 0 ? `, ${failed} gagal` : ''}.`)
    }

    const syncHPPToProduct = async (recipe: Recipe) => {
        if (!recipe.product_id) return
        const { hppPerUnit } = computeHPP(recipe)
        setSyncing(recipe.id)
        const { error } = await supabase
            .from('products')
            .update({ cost_price: Math.round(hppPerUnit) })
            .eq('id', recipe.product_id)
        setSyncing(null)
        if (error) { alert('Gagal sync HPP: ' + error.message); return }
        router.refresh()
        alert(`HPP berhasil disinkronkan ke produk "${recipe.products?.name}": ${fc(Math.round(hppPerUnit))} / unit`)
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Resep & Kalkulator HPP</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Kelola resep produk dan hitung harga pokok produksi per unit
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncAll}
                        disabled={syncingAll || recipes.filter(r => r.product_id).length === 0}
                        className="flex items-center gap-2 border border-green-600 text-green-700 px-4 py-2 rounded-md hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={`Sync HPP ke semua produk (${recipes.filter(r => r.product_id).length} resep tertaut)`}
                    >
                        {syncingAll
                            ? <Loader2 size={16} className="animate-spin" />
                            : <RefreshCw size={16} />
                        }
                        Sync All HPP
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        <Plus size={18} /> Buat Resep
                    </button>
                </div>
            </div>

            {/* No inventory warning */}
            {inventory.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-sm text-amber-800">
                        Belum ada item inventory. Tambahkan bahan baku di menu{' '}
                        <strong>Inventory</strong> terlebih dahulu sebelum membuat resep.
                    </p>
                </div>
            )}

            {/* Recipe cards */}
            {loading ? (
                <div className="text-center py-16 text-gray-400">Memuat resep...</div>
            ) : recipes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-16 text-center">
                    <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">Belum ada resep</p>
                    <p className="text-gray-400 text-sm mt-1">Mulai dengan membuat resep pertama</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {recipes.map(recipe => {
                        const hpp = computeHPP(recipe)
                        const missingCosts = (recipe.recipe_ingredients ?? []).some(
                            ing => !ing.inventory?.unit_cost
                        )
                        return (
                            <div key={recipe.id} className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
                                {/* Title */}
                                <div>
                                    <h3 className="font-bold text-gray-900">{recipe.name}</h3>
                                    {recipe.products && (
                                        <p className="text-xs text-indigo-600 mt-0.5">
                                            Produk: {recipe.products.name}
                                        </p>
                                    )}
                                </div>

                                {/* Quick stats */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-gray-500 text-xs">Yield</p>
                                        <p className="font-semibold text-gray-800">
                                            {recipe.yield_quantity} {recipe.yield_unit}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-gray-500 text-xs">Bahan</p>
                                        <p className="font-semibold text-gray-800">
                                            {(recipe.recipe_ingredients ?? []).length} item
                                        </p>
                                    </div>
                                </div>

                                {/* HPP per unit */}
                                <div className={`rounded-lg p-3 ${missingCosts ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                                    <p className="text-xs text-gray-500">HPP per unit</p>
                                    <p className={`text-xl font-bold ${missingCosts ? 'text-amber-700' : 'text-green-700'}`}>
                                        {fc(hpp.hppPerUnit)}
                                    </p>
                                    {missingCosts && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            ⚠ Beberapa bahan belum punya unit cost
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setHPPRecipe(recipe)}
                                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-sm py-1.5 rounded hover:bg-gray-50"
                                    >
                                        <ChevronRight size={14} /> Detail HPP
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(recipe)}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                        title="Duplikasi resep"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => openEdit(recipe)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit resep"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(recipe)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        title="Hapus resep"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── HPP Detail Modal ──────────────────────────────────────────────────── */}
            {hppRecipe && (() => {
                const hpp = computeHPP(hppRecipe)
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-start rounded-t-xl">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{hppRecipe.name}</h2>
                                    <p className="text-sm text-gray-500">
                                        Yield: {hppRecipe.yield_quantity} {hppRecipe.yield_unit} per batch
                                    </p>
                                </div>
                                <button onClick={() => setHPPRecipe(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                {/* Ingredients table */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <Package size={14} /> Bahan Baku (per batch)
                                    </h3>
                                    {(hppRecipe.recipe_ingredients ?? []).length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Belum ada bahan</p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                                                    <th className="pb-1.5 font-medium">Bahan</th>
                                                    <th className="pb-1.5 font-medium text-right">Qty</th>
                                                    <th className="pb-1.5 font-medium text-right">Unit Cost</th>
                                                    <th className="pb-1.5 font-medium text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(hppRecipe.recipe_ingredients ?? []).map(ing => {
                                                    const unitCost = ing.inventory?.unit_cost ?? 0
                                                    const sub = ing.quantity * unitCost
                                                    return (
                                                        <tr key={ing.id}>
                                                            <td className="py-1.5 text-gray-800">
                                                                {ing.inventory?.name ?? '—'}
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-600">
                                                                {ing.quantity} {ing.inventory?.unit}
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-600">
                                                                {unitCost ? fc(unitCost) : (
                                                                    <span className="text-amber-500 text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-1.5 text-right font-medium text-gray-800">
                                                                {fc(sub)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Cost summary */}
                                <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Bahan Baku</span>
                                        <span className="font-medium">{fc(hpp.materialCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Biaya Kerja</span>
                                        <span className="font-medium">{fc(hpp.laborCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Biaya Lainnya (overhead)</span>
                                        <span className="font-medium">{fc(hpp.overheadCost)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-2">
                                        <span>Total per Batch</span>
                                        <span>{fc(hpp.totalPerBatch)}</span>
                                    </div>
                                </div>

                                {/* HPP per unit result */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-sm text-indigo-700 font-medium">
                                        HPP per Unit ({hppRecipe.yield_unit})
                                    </p>
                                    <p className="text-3xl font-bold text-indigo-800 mt-1">
                                        {fc(hpp.hppPerUnit)}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        {fc(hpp.totalPerBatch)} ÷ {hppRecipe.yield_quantity} {hppRecipe.yield_unit}
                                    </p>
                                </div>

                                {/* Sync button */}
                                {hppRecipe.product_id && (
                                    <button
                                        onClick={() => syncHPPToProduct(hppRecipe)}
                                        disabled={syncing === hppRecipe.id}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                                    >
                                        {syncing === hppRecipe.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <RefreshCw size={16} />
                                        )}
                                        Sync HPP ke Produk: {hppRecipe.products?.name}
                                    </button>
                                )}
                                {!hppRecipe.product_id && (
                                    <p className="text-center text-xs text-gray-400">
                                        Tautkan ke produk untuk mengaktifkan sync HPP
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* ── Form Modal ────────────────────────────────────────────────────────── */}
            {formOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingRecipe ? 'Edit Resep' : 'Buat Resep Baru'}
                            </h2>
                            <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
                            {/* Basic info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Resep <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                                        placeholder="Cth: Sourdough Basic"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tautkan ke Produk
                                        <span className="ml-1 text-xs text-gray-400 font-normal">opsional — untuk sync HPP</span>
                                    </label>
                                    <select
                                        value={formData.product_id}
                                        onChange={e => setFormData(d => ({ ...d, product_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">— Tidak ditautkan —</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Yield per Batch <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={formData.yield_quantity}
                                            onChange={e => setFormData(d => ({ ...d, yield_quantity: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Satuan Yield
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.yield_unit}
                                            onChange={e => setFormData(d => ({ ...d, yield_unit: e.target.value }))}
                                            placeholder="pcs / loaf / box"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Biaya Kerja / Batch (IDR)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={formData.labor_cost_per_batch}
                                            onChange={e => setFormData(d => ({ ...d, labor_cost_per_batch: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Biaya Lainnya / Batch (IDR)
                                            <span className="block text-xs text-gray-400 font-normal">listrik, gas, dll</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={formData.overhead_cost_per_batch}
                                            onChange={e => setFormData(d => ({ ...d, overhead_cost_per_batch: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Ingredients section */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        Bahan Baku
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addIngredientRow}
                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Plus size={14} /> Tambah Bahan
                                    </button>
                                </div>

                                {tempIngredients.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
                                        Belum ada bahan. Klik "Tambah Bahan" untuk mulai.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                                            <span className="col-span-5">Bahan (dari inventory)</span>
                                            <span className="col-span-3">Qty per batch</span>
                                            <span className="col-span-3">Unit cost saat ini</span>
                                            <span className="col-span-1"></span>
                                        </div>
                                        {tempIngredients.map(ing => {
                                            const inv = inventory.find(i => i.id === ing.inventory_id)
                                            return (
                                                <div key={ing.tempId} className="grid grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-5">
                                                        <select
                                                            value={ing.inventory_id}
                                                            onChange={e => updateIngredientRow(ing.tempId, 'inventory_id', e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="">Pilih bahan...</option>
                                                            {inventory.map(item => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name} ({item.unit})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            placeholder={`dalam ${inv?.unit ?? 'unit'}`}
                                                            value={ing.quantity}
                                                            onChange={e => updateIngredientRow(ing.tempId, 'quantity', e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-3 text-sm text-gray-500">
                                                        {inv ? fc(inv.unit_cost) + '/' + inv.unit : '—'}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeIngredientRow(ing.tempId)}
                                                        className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Live HPP preview in form */}
                                {tempIngredients.some(i => i.inventory_id && i.quantity) && (
                                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm">
                                        {(() => {
                                            const materialCost = tempIngredients.reduce((sum, ing) => {
                                                const inv = inventory.find(i => i.id === ing.inventory_id)
                                                return sum + (Number(ing.quantity) || 0) * (inv?.unit_cost ?? 0)
                                            }, 0)
                                            const labor = Number(formData.labor_cost_per_batch) || 0
                                            const overhead = Number(formData.overhead_cost_per_batch) || 0
                                            const total = materialCost + labor + overhead
                                            const yield_ = Number(formData.yield_quantity) || 1
                                            return (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-indigo-700">Preview HPP per unit:</span>
                                                    <span className="font-bold text-indigo-800 text-base">
                                                        {fc(total / yield_)}
                                                    </span>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Form actions */}
                            <div className="flex gap-3 pt-2 border-t border-gray-100">
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
                                    {editingRecipe ? 'Simpan Perubahan' : 'Buat Resep'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
