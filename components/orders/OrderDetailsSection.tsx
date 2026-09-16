'use client'

import React from 'react'
import type { OrderFormData, Customer, BatchOption, Store } from './types'

interface OrderDetailsSectionProps {
    formData: OrderFormData
    setFormData: React.Dispatch<React.SetStateAction<OrderFormData>>
    customerSearch: string
    handleCustomerSearch: (value: string) => void
    showCustomerSuggestions: boolean
    setShowCustomerSuggestions: (show: boolean) => void
    filteredCustomers: Customer[]
    handleSelectCustomer: (customer: Customer) => void
    batches: BatchOption[]
    stores: Store[]
    onStoreChange: (storeId: string) => void
}

export default function OrderDetailsSection({
    formData,
    setFormData,
    customerSearch,
    handleCustomerSearch,
    showCustomerSuggestions,
    setShowCustomerSuggestions,
    filteredCustomers,
    handleSelectCustomer,
    batches,
    stores,
    onStoreChange,
}: OrderDetailsSectionProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input
                        type="text"
                        required
                        value={formData.invoice_number}
                        onChange={e => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    />
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <input
                        type="text"
                        required
                        value={customerSearch}
                        onChange={e => handleCustomerSearch(e.target.value)}
                        onFocus={() => customerSearch && setShowCustomerSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        placeholder="Search customer by name or phone..."
                    />
                    {showCustomerSuggestions && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                            {filteredCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                >
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-sm text-gray-500">{customer.phone}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch (PO)</label>
                    <select
                        value={formData.po_id}
                        onChange={e => setFormData(prev => ({ ...prev, po_id: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    >
                        <option value="">Select Batch...</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
                {stores.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                        <select
                            value={formData.store_id}
                            onChange={e => onStoreChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                            <option value="">No Store</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    )
}
