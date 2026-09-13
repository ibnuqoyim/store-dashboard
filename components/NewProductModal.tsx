'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Save, Info } from 'lucide-react';
import { CatalogProduct } from './ProductPosCart';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (newProduct: CatalogProduct) => void;
}

export default function NewProductModal({ isOpen, onClose, onSaveProduct }: NewProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sourdough');
  const [price, setPrice] = useState('');
  const [doughRecipe, setDoughRecipe] = useState('Soft Bread Base (120g/unit)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Harap isi Nama dan Harga produk secara benar!');
      return;
    }

    const newProduct: CatalogProduct = {
      id: crypto.randomUUID(),
      name: name.trim(),
      price: parsedPrice,
      category: category,
      doughRecipe: doughRecipe,
    };

    onSaveProduct(newProduct);
    setName('');
    setPrice('');
    setCategory('Sourdough');
    setDoughRecipe('Soft Bread Base (120g/unit)');
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
              <label className="block font-semibold text-gray-600 mb-1">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                <option value="Sourdough">Sourdough</option>
                <option value="Sweet Bread">Sweet Bread</option>
                <option value="Paket">Paket Mini</option>
              </select>
            </div>
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
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Pilih Resep Adonan Dasar (Kalkulasi Dapur)</label>
            <select
              value={doughRecipe}
              onChange={(e) => setDoughRecipe(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
            >
              <option value="Soft Bread Base (120g/unit)">Soft Bread Base (120g flour/unit)</option>
              <option value="Sourdough Classic Base (350g/unit)">Sourdough Classic Base (350g flour/unit)</option>
              <option value="Sweet Dough Base (90g/unit)">Sweet Dough Base (90g flour/unit)</option>
            </select>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <Info className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            Produk baru tersimpan di Master Data catalog dan langsung dapat dipilih di grid POS ini.
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Munculkan di POS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
