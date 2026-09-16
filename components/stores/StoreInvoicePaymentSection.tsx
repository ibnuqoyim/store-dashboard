'use client'

import React from 'react'
import type { StoreInfo } from './store-types'

interface StoreInvoicePaymentSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreInvoicePaymentSection({
  formData,
  setFormData,
}: StoreInvoicePaymentSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-900">Informasi Invoice & Pembayaran</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
          <input
            type="text"
            value={formData.bank_name || ''}
            onChange={e => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="Contoh: BRI, BCA, Mandiri"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
          <input
            type="text"
            value={formData.bank_account || ''}
            onChange={e => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="Nomor rekening"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
          <input
            type="text"
            value={formData.bank_holder || ''}
            onChange={e => setFormData(prev => ({ ...prev, bank_holder: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="Nama a.n rekening"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Penutup Invoice</label>
          <input
            type="text"
            value={formData.invoice_closing_message || ''}
            onChange={e => setFormData(prev => ({ ...prev, invoice_closing_message: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="Contoh: Terima Kasih"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub-pesan Penutup</label>
          <input
            type="text"
            value={formData.invoice_closing_sub || ''}
            onChange={e => setFormData(prev => ({ ...prev, invoice_closing_sub: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            placeholder="Contoh: Baarakallaahu fiikum"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.currency || 'IDR'}
            onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          >
            <option value="IDR">IDR (Rupiah)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="SGD">SGD (Singapore Dollar)</option>
            <option value="MYR">MYR (Malaysian Ringgit)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
          <select
            value={formData.locale || 'id-ID'}
            onChange={e => setFormData(prev => ({ ...prev, locale: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          >
            <option value="id-ID">id-ID (Indonesia)</option>
            <option value="en-US">en-US (US English)</option>
            <option value="en-SG">en-SG (Singapore English)</option>
            <option value="ms-MY">ms-MY (Malaysian)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template WhatsApp</label>
          <textarea
            value={formData.whatsapp_greeting_template || ''}
            onChange={e => setFormData(prev => ({ ...prev, whatsapp_greeting_template: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            rows={3}
            placeholder="Gunakan {name}, {invoice}, {total} sebagai variabel. Kosongkan untuk menggunakan template default."
          />
        </div>
      </div>
    </div>
  )
}
