'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency, BusinessConfig } from '@/lib/config'
import type { OrderItem, Product } from './types'

interface OrderItemsSectionProps {
    items: OrderItem[]
    productSearch: Record<number, string>
    showProductSuggestions: Record<number, boolean>
    getFilteredProducts: (index: number) => Product[]
    handleProductSearch: (index: number, value: string) => void
    handleSelectProduct: (index: number, product: Product) => void
    setShowProductSuggestions: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
    addItem: () => void
    updateItem: (index: number, field: keyof OrderItem, value: string | number) => void
    removeItem: (index: number) => void
    config: BusinessConfig
}

export default function OrderItemsSection({
    items,
    productSearch,
    showProductSuggestions,
    getFilteredProducts,
    handleProductSearch,
    handleSelectProduct,
    setShowProductSuggestions,
    addItem,
    updateItem,
    removeItem,
    config,
}: OrderItemsSectionProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Items</h2>
                <button
                    type="button"
                    onClick={addItem}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-end border-b pb-4">
                        <div className="flex-1 relative">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                            <input
                                type="text"
                                required
                                value={productSearch[index] || ''}
                                onChange={e => handleProductSearch(index, e.target.value)}
                                onFocus={() =>
                                    (productSearch[index] || '').length > 0 &&
                                    setShowProductSuggestions(prev => ({ ...prev, [index]: true }))
                                }
                                onBlur={() =>
                                    setTimeout(() => setShowProductSuggestions(prev => ({ ...prev, [index]: false })), 200)
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                placeholder="Search product..."
                            />
                            {showProductSuggestions[index] && getFilteredProducts(index).length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-10 max-h-40 overflow-y-auto">
                                    {getFilteredProducts(index).map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleSelectProduct(index, product)}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-sm text-gray-500">{formatCurrency(product.price, config)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                            <input
                                type="number"
                                required
                                value={item.price}
                                onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                                readOnly
                            />
                        </div>
                        <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 pb-3">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
