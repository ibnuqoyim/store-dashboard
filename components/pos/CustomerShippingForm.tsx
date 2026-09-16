'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserCheck, Search } from 'lucide-react';
import { CustomerShippingData, ShippingMethod, Customer } from '@/lib/types/batch';

interface CustomerShippingFormProps {
  data: CustomerShippingData;
  customerList: Customer[];
  onChange: (updated: CustomerShippingData) => void;
  onAddNewCustomer?: (name: string, phone: string, courier?: ShippingMethod) => void;
}

export default function CustomerShippingForm({
  data,
  customerList,
  onChange,
}: CustomerShippingFormProps) {
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = customerList.filter((c) =>
    c.name.toLowerCase().includes((data.customerName || '').toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (cust: Customer) => {
    onChange({
      ...data,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone || data.customerPhone,
      shippingMethod: (cust.default_courier as ShippingMethod) || data.shippingMethod,
    });
    setIsOpenSuggestions(false);
  };

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
        {/* Customer Autocomplete Input */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Nama Pembeli *</label>
          <div className="relative">
            <input
              type="text"
              value={data.customerName}
              onChange={(e) => {
                onChange({ ...data, customerName: e.target.value, customerId: undefined });
                setIsOpenSuggestions(true);
              }}
              onFocus={() => setIsOpenSuggestions(true)}
              placeholder="Ketik nama (autocomplete)..."
              className="w-full px-2.5 py-2.5 xl:py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-gray-800"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2" />
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpenSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-amber-200 rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto text-xs py-1">
              {filteredCustomers.length === 0 ? (
                <div className="p-2 text-center text-gray-400 text-[11px]">
                  <span>Pelanggan baru: </span>
                  <span className="font-bold text-amber-800">{data.customerName}</span>
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="px-3 py-2 hover:bg-amber-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-none"
                  >
                    <div>
                      <span className="font-bold text-gray-800 block">{cust.name}</span>
                      <span className="text-[10px] text-gray-400">{cust.phone || 'No WA (-)'}</span>
                    </div>
                    {cust.default_courier && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        {cust.default_courier}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">No. WhatsApp / Kontak</label>
          <input
            type="text"
            value={data.customerPhone}
            onChange={(e) => onChange({ ...data, customerPhone: e.target.value })}
            placeholder="087722732214"
            className="w-full px-2.5 py-2.5 xl:py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* METODE PENGIRIMAN DROPDOWN + INPUT ONGKIR */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7">
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Kurir / Pengiriman *</label>
          <select
            value={data.shippingMethod}
            onChange={(e) => onChange({ ...data, shippingMethod: e.target.value as ShippingMethod })}
            className="w-full bg-white border border-amber-300 text-gray-800 font-bold text-xs rounded-lg p-2.5 xl:p-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
            onChange={(e) => onChange({ ...data, shippingFee: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-2 py-2.5 xl:py-1.5 text-xs bg-white border border-amber-300 font-bold text-amber-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
