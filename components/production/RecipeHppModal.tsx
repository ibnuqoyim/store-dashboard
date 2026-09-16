'use client'

import React from 'react'
import { Package, X, Loader2, RefreshCw } from 'lucide-react'
import { computeHPP, type Recipe } from './recipe-types'

interface RecipeHppModalProps {
    recipe: Recipe | null
    onClose: () => void
    onSync: (recipe: Recipe) => void
    syncing: boolean
    fc: (n: number) => string
}

export default function RecipeHppModal({
    recipe,
    onClose,
    onSync,
    syncing,
    fc,
}: RecipeHppModalProps) {
    if (!recipe) return null

    const hpp = computeHPP(recipe)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-start rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{recipe.name}</h2>
                        <p className="text-sm text-gray-500">
                            Yield: {recipe.yield_quantity} {recipe.yield_unit} per batch
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Ingredients table */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Package size={14} /> Bahan Baku (per batch)
                        </h3>
                        {(recipe.recipe_ingredients ?? []).length === 0 ? (
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
                                    {(recipe.recipe_ingredients ?? []).map(ing => {
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
                            HPP per Unit ({recipe.yield_unit})
                        </p>
                        <p className="text-3xl font-bold text-indigo-800 mt-1">
                            {fc(hpp.hppPerUnit)}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                            {fc(hpp.totalPerBatch)} ÷ {recipe.yield_quantity} {recipe.yield_unit}
                        </p>
                    </div>

                    {/* Sync button */}
                    {recipe.product_id && (
                        <button
                            type="button"
                            onClick={() => onSync(recipe)}
                            disabled={syncing}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium cursor-pointer"
                        >
                            {syncing ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <RefreshCw size={16} />
                            )}
                            Sync HPP ke Produk: {recipe.products?.name}
                        </button>
                    )}
                    {!recipe.product_id && (
                        <p className="text-center text-xs text-gray-400">
                            Tautkan ke produk untuk mengaktifkan sync HPP
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
