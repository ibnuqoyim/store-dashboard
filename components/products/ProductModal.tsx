'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Save, Info, Loader2, ImagePlus, Trash2, Pencil } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { createClient } from '@/utils/supabase/client';
import { getResizedImageUrl, isTrustedCloudinaryUrl } from '@/lib/cloudinary-image';
import { CatalogProduct, Dough } from '@/lib/types/batch';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: CatalogProduct) => void;
  doughs: Dough[];
  productToEdit?: CatalogProduct | null;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSaveProduct,
  doughs,
  productToEdit = null,
}: ProductModalProps) {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [doughId, setDoughId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setPrice(String(productToEdit.price || ''));
      setDoughId(productToEdit.doughId || '');
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      setName('');
      setPrice('');
      setDoughId('');
      setImageUrl('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPrice('');
    setDoughId('');
    setImageUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Harap isi Nama dan Harga produk secara benar (angka positif)!');
      return;
    }

    setIsSaving(true);
    try {
      if (productToEdit) {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            price: parsedPrice,
            dough_id: doughId || null,
            image_url: imageUrl || null,
          })
          .eq('id', productToEdit.id)
          .select('id, name, price, image_url, dough_id')
          .single();

        if (error || !data) throw error || new Error('Gagal update produk');

        const dough = doughs.find((d) => d.id === data.dough_id);
        onSaveProduct({
          id: data.id,
          name: data.name,
          price: data.price,
          imageUrl: data.image_url,
          doughId: data.dough_id,
          doughName: dough?.name ?? null,
        });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: name.trim(),
            price: parsedPrice,
            dough_id: doughId || null,
            image_url: imageUrl || null,
            is_active: true,
            is_ready: true,
          })
          .select('id, name, price, image_url, dough_id')
          .single();

        if (error || !data) throw error || new Error('Gagal menambah produk');

        const dough = doughs.find((d) => d.id === data.dough_id);
        onSaveProduct({
          id: data.id,
          name: data.name,
          price: data.price,
          imageUrl: data.image_url,
          doughId: data.dough_id,
          doughName: dough?.name ?? null,
        });
      }

      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Gagal menyimpan produk: ' + message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl p-5 max-w-lg w-full mx-4 shadow-xl border border-amber-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            {productToEdit ? (
              <Pencil className="w-5 h-5 text-amber-600" />
            ) : (
              <PlusCircle className="w-5 h-5 text-amber-600" />
            )}
            <span>{productToEdit ? 'Edit Produk' : 'Buat Produk Baru Instan (On-the-Fly)'}</span>
          </h3>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Nama Produk *</label>
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
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">Tanpa resep</option>
                {doughs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Foto Produk</label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getResizedImageUrl(imageUrl, 64, 64) || imageUrl}
                  alt="Preview produk"
                  className="h-16 w-16 object-cover rounded-lg border border-gray-300 shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
              )}
              <div className="flex gap-2">
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products'}
                  onSuccess={(result) => {
                    const info = result.info;
                    const url = info && typeof info === 'object' && 'secure_url' in info ? (info.secure_url as string) : null;
                    if (isTrustedCloudinaryUrl(url)) {
                      setImageUrl(url);
                    } else {
                      alert('Upload gagal: URL gambar tidak dikenali. Coba lagi.');
                    }
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      {imageUrl ? 'Ganti Foto' : 'Upload Foto'}
                    </button>
                  )}
                </CldUploadWidget>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <Info className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            Produk tersimpan di Master Data (modul Products) dan langsung terupdate di katalog POS.
          </div>

          <div className="flex justify-end gap-2 mt-5 border-t pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{productToEdit ? 'Simpan Perubahan' : 'Simpan & Munculkan di POS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
