'use client'

import React from 'react'
import { ChevronRight, Copy, Pencil, Trash2 } from 'lucide-react'
import { computeHPP, type Recipe } from './recipe-types'

interface RecipeCardProps {
    recipe: Recipe
    onViewHpp: (recipe: Recipe) => void
    onDuplicate: (recipe: Recipe) => void
    onEdit: (recipe: Recipe) => void
    onDelete: (recipe: Recipe) => void
    fc: (n: number) => string
}

export default function RecipeCard({
    recipe,
    onViewHpp,
    onDuplicate,
    onEdit,
    onDelete,
    fc,
}: RecipeCardProps) {
    const hpp = computeHPP(recipe)
    const missingCosts = (recipe.recipe_ingredients ?? []).some(
        ing => !ing.inventory?.unit_cost
    )

    return (
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
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
            <div
                className={`rounded-lg p-3 ${
                    missingCosts
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-green-50 border border-green-200'
                }`}
            >
                <p className="text-xs text-gray-500">HPP per unit</p>
                <p
                    className={`text-xl font-bold ${
                        missingCosts ? 'text-amber-700' : 'text-green-700'
                    }`}
                >
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
                    type="button"
                    onClick={() => onViewHpp(recipe)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-sm py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                >
                    <ChevronRight size={14} /> Detail HPP
                </button>
                <button
                    type="button"
                    onClick={() => onDuplicate(recipe)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                    title="Duplikasi resep"
                >
                    <Copy size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(recipe)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Edit resep"
                >
                    <Pencil size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(recipe)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    title="Hapus resep"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}
