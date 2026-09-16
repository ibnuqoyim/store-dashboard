'use client'

import React from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import type { Product, InventoryItem, TempIngredient, RecipeFormData } from './recipe-types'

interface RecipeFormModalProps {
    isOpen: boolean
    isEditing: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    formData: RecipeFormData
    setFormData: React.Dispatch<React.SetStateAction<RecipeFormData>>
    tempIngredients: TempIngredient[]
    addIngredientRow: () => void
    updateIngredientRow: (tempId: string, field: keyof TempIngredient, value: string) => void
    removeIngredientRow: (tempId: string) => void
    products: Product[]
    inventory: InventoryItem[]
    saving: boolean
    fc: (n: number) => string
}

export default function RecipeFormModal({
    isOpen,
    isEditing,
    onClose,
    onSubmit,
    formData,
    setFormData,
    tempIngredients,
    addIngredientRow,
    updateIngredientRow,
    removeIngredientRow,
    products,
    inventory,
    saving,
    fc,
}: RecipeFormModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Edit Resep' : 'Buat Resep Baru'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
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
                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                                <Plus size={14} /> Tambah Bahan
                            </button>
                        </div>

                        {tempIngredients.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
                                Belum ada bahan. Klik &quot;Tambah Bahan&quot; untuk mulai.
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
                                                className="col-span-1 text-red-400 hover:text-red-600 flex justify-center cursor-pointer"
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
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-medium"
                        >
                            {saving && <Loader2 className="animate-spin" size={16} />}
                            {isEditing ? 'Simpan Perubahan' : 'Buat Resep'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
