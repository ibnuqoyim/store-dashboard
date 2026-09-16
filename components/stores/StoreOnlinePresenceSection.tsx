'use client'

import React from 'react'
import type { StoreInfo } from './store-types'

interface StoreOnlinePresenceSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreOnlinePresenceSection({
  formData,
  setFormData,
}: StoreOnlinePresenceSectionProps) {
  return (
    <div className="space-y-6">
      {/* Maps Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Maps Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maps URL</label>
            <input
              type="url"
              value={formData.maps_url || ''}
              onChange={e => setFormData(prev => ({ ...prev, maps_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maps Embed URL</label>
            <input
              type="url"
              value={formData.maps_embed_url || ''}
              onChange={e => setFormData(prev => ({ ...prev, maps_embed_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
        </div>
      </div>

      {/* Contact & Social Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Media Sosial & Kontak Tambahan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
            <input
              type="text"
              value={formData.contact_instagram_handle || ''}
              onChange={e => setFormData(prev => ({ ...prev, contact_instagram_handle: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="@your_handle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input
              type="url"
              value={formData.contact_instagram_url || ''}
              onChange={e => setFormData(prev => ({ ...prev, contact_instagram_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input
              type="tel"
              value={formData.contact_whatsapp_number || ''}
              onChange={e => setFormData(prev => ({ ...prev, contact_whatsapp_number: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="+62..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp URL</label>
            <input
              type="url"
              value={formData.contact_whatsapp_url || ''}
              onChange={e => setFormData(prev => ({ ...prev, contact_whatsapp_url: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://wa.me/..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={formData.contact_email || ''}
              onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
