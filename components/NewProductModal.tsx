'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Save, Info, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { CatalogProduct, Dough } from '@/lib/types/batch';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (newProduct: CatalogProduct) => void;
  doughs: Dough[];
}

export default function NewProductModal({ isOpen, onClose, onSaveProduct, doughs }: NewProductModalProps) {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [doughId, setDoughId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPrice('');
    setDoughId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Harap isi Nama dan Harga produk secara benar!');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        price: parsedPrice,
        dough_id: doughId || null,
        is_active: true,
        is_ready: true,
      })
      .select('id, name, price, dough_id')
      .single();
    setIsSaving(false);

    if (error || !data) {
      alert('Gagal menyimpan produk: ' + (error?.message ?? 'unknown error'));
      return;
    }

    const dough = doughs.find((d) => d.id === data.dough_id);
    onSaveProduct({
      id: data.id,
      name: data.name,
      price: data.price,
      doughId: data.dough_id,
      doughName: dough?.name ?? null,
    });
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full mx-4 shadow-xl border border-amber-100">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-600" />
            <span>Buat Produk Baru Instan (On-the-Fly)</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Nama Produk Baru *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Cinnamon Roll Cream Cheese"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Harga Jual (Rp) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25000"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Resep Adonan (Modul Adonan)</label>
              <select
                value={doughId}
                onChange={(e) => setDoughId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Tanpa resep</option>
                {doughs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <Info className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            Produk baru tersimpan langsung di Master Data (modul Products) dan langsung dapat dipilih di grid POS ini.
          </div>

          <div className="flex justify-end gap-2 mt-5 border-t pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan & Munculkan di POS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
