'use client'

import React from 'react'
import type { StoreInfo } from './store-types'

interface StoreBasicInfoSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreBasicInfoSection({
  formData,
  setFormData,
}: StoreBasicInfoSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-900">Core Identity</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name*</label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
          <input
            type="email"
            required
            value={formData.email || ''}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
          <input
            type="tel"
            required
            value={formData.phone || ''}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours*</label>
          <input
            type="text"
            required
            value={formData.opening_hours || ''}
            onChange={e => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="e.g., Mon-Fri 9:00-18:00"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
          <textarea
            required
            value={formData.address || ''}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
