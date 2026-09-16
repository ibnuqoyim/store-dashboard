'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Plus, Loader2, BookOpen, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'
import RecipeCard from './RecipeCard'
import RecipeHppModal from './RecipeHppModal'
import RecipeFormModal from './RecipeFormModal'
import {
    computeHPP,
    type Product,
    type InventoryItem,
    type Recipe,
    type TempIngredient,
    type RecipeFormData,
} from './recipe-types'

export type { Recipe, Product, InventoryItem, Ingredient, HPPResult } from './recipe-types'

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

    // Modals state
    const [hppRecipe, setHPPRecipe] = useState<Recipe | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

    const [formData, setFormData] = useState<RecipeFormData>({
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
    }, [supabase])

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
                        name: formData.name.trim(),
                        product_id: formData.product_id || null,
                        yield_quantity: Number(formData.yield_quantity),
                        yield_unit: formData.yield_unit.trim() || 'pcs',
                        labor_cost_per_batch: Number(formData.labor_cost_per_batch),
                        overhead_cost_per_batch: Number(formData.overhead_cost_per_batch),
                        notes: formData.notes?.trim() || null,
                    })
                    .eq('id', editingRecipe.id)
                if (error) throw error
                recipeId = editingRecipe.id
            } else {
                const { data, error } = await supabase
                    .from('recipes')
                    .insert({
                        name: formData.name.trim(),
                        product_id: formData.product_id || null,
                        yield_quantity: Number(formData.yield_quantity),
                        yield_unit: formData.yield_unit.trim() || 'pcs',
                        labor_cost_per_batch: Number(formData.labor_cost_per_batch),
                        overhead_cost_per_batch: Number(formData.overhead_cost_per_batch),
                        notes: formData.notes?.trim() || null,
                    })
                    .select('id')
                    .single()
                if (error) throw error
                recipeId = data.id
            }

            // Sync recipe_ingredients: delete old, re-insert valid
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)

            if (validIngredients.length > 0) {
                const { error: ingError } = await supabase
                    .from('recipe_ingredients')
                    .insert(
                        validIngredients.map(ing => ({
                            recipe_id: recipeId,
                            inventory_id: ing.inventory_id,
                            quantity: Number(ing.quantity),
                            notes: ing.notes?.trim() || null,
                        }))
                    )
                if (ingError) throw ingError
            }

            setFormOpen(false)
            await fetchRecipes()
        } catch (err) {
            alert('Gagal menyimpan resep: ' + (err instanceof Error ? err.message : 'unknown error'))
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
                product_id: null,
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
                        type="button"
                        onClick={handleSyncAll}
                        disabled={syncingAll || recipes.filter(r => r.product_id).length === 0}
                        className="flex items-center gap-2 border border-green-600 text-green-700 px-4 py-2 rounded-md hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={`Sync HPP ke semua produk (${recipes.filter(r => r.product_id).length} resep tertaut)`}
                    >
                        {syncingAll
                            ? <Loader2 size={16} className="animate-spin" />
                            : <RefreshCw size={16} />}
                        Sync Semua HPP
                    </button>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 cursor-pointer"
                    >
                        <Plus size={18} />
                        Buat Resep
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

            {/* Recipe cards grid */}
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
                    {recipes.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onViewHpp={setHPPRecipe}
                            onDuplicate={handleDuplicate}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            fc={fc}
                        />
                    ))}
                </div>
            )}

            {/* HPP Detail Modal */}
            <RecipeHppModal
                recipe={hppRecipe}
                onClose={() => setHPPRecipe(null)}
                onSync={syncHPPToProduct}
                syncing={syncing === hppRecipe?.id}
                fc={fc}
            />

            {/* Form Modal */}
            <RecipeFormModal
                isOpen={formOpen}
                isEditing={Boolean(editingRecipe)}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
                formData={formData}
                setFormData={setFormData}
                tempIngredients={tempIngredients}
                addIngredientRow={addIngredientRow}
                updateIngredientRow={updateIngredientRow}
                removeIngredientRow={removeIngredientRow}
                products={products}
                inventory={inventory}
                saving={saving}
                fc={fc}
            />
        </div>
    )
}
