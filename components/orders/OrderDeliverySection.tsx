'use client'

import React from 'react'
import type { Delivery, ShippingRate } from './types'

interface OrderDeliverySectionProps {
    hasDelivery: boolean
    toggleDelivery: (checked: boolean) => void
    delivery: Delivery | null
    shippingRates: ShippingRate[]
    handleCourierChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    updateDelivery: (field: keyof Delivery, value: string | number) => void
}

export default function OrderDeliverySection({
    hasDelivery,
    toggleDelivery,
    delivery,
    shippingRates,
    handleCourierChange,
    updateDelivery,
}: OrderDeliverySectionProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    id="hasDelivery"
                    checked={hasDelivery}
                    onChange={e => toggleDelivery(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="hasDelivery" className="text-lg font-bold cursor-pointer text-gray-900">
                    Include Delivery
                </label>
            </div>

            {hasDelivery && delivery && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                        <select
                            value={delivery.courier_name}
                            onChange={handleCourierChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                            <option value="">Select Courier...</option>
                            {shippingRates.map(rate => (
                                <option key={rate.id} value={rate.courier_name}>
                                    {rate.courier_name} - {rate.description} ({rate.cost})
                                </option>
                            ))}
                            <option value="Manual">Manual Input</option>
                        </select>
                    </div>
                    {delivery.courier_name === 'Manual' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manual Courier Name</label>
                            <input
                                type="text"
                                value={delivery.courier_name === 'Manual' ? '' : delivery.courier_name}
                                onChange={e => updateDelivery('courier_name', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                placeholder="Enter courier name"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                        <input
                            type="number"
                            value={delivery.shipping_cost}
                            onChange={e => updateDelivery('shipping_cost', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            value={delivery.address}
                            onChange={e => updateDelivery('address', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                        <select
                            value={delivery.status}
                            onChange={e => updateDelivery('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
