'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';

export interface CustomerShippingData {
  customerName: string;
  customerPhone: string;
  shippingMethod: 'Ahsan' | 'TIKI' | 'COD' | 'Ambil Sendiri';
  shippingFee: number;
}

interface CustomerShippingFormProps {
  data: CustomerShippingData;
  onChange: (updated: CustomerShippingData) => void;
}

export default function CustomerShippingForm({ data, onChange }: CustomerShippingFormProps) {
  return (
    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-amber-600" />
          <span>1. Data Pembeli & Pengiriman</span>
        </h3>
        <span className="text-[10px] text-gray-400 font-semibold">* Wajib Diisi</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Nama Pembeli *</label>
          <input
            type="text"
            value={data.customerName}
            onChange={(e) => onChange({ ...data, customerName: e.target.value })}
            placeholder="Contoh: Pak Ahmad / Ibu Siska"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">No. WhatsApp / Kontak</label>
          <input
            type="text"
            value={data.customerPhone}
            onChange={(e) => onChange({ ...data, customerPhone: e.target.value })}
            placeholder="087722732214"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* METODE PENGIRIMAN DROPDOWN + INPUT ONGKIR */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7">
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Kurir / Pengiriman *</label>
          <select
            value={data.shippingMethod}
            onChange={(e) => onChange({ ...data, shippingMethod: e.target.value as any })}
            className="w-full bg-white border border-amber-300 text-gray-800 font-bold text-xs rounded-lg p-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="Ahsan">Ahsan Express (Kurir)</option>
            <option value="TIKI">TIKI (Regular/ONS)</option>
            <option value="COD">COD (Bayar di Tempat)</option>
            <option value="Ambil Sendiri">Ambil Sendiri / Store</option>
          </select>
        </div>
        <div className="col-span-5">
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Ongkos Kirim (Rp)</label>
          <input
            type="number"
            value={data.shippingFee || ''}
            onChange={(e) => onChange({ ...data, shippingFee: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-2 py-1.5 text-xs bg-white border border-amber-300 font-bold text-amber-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
