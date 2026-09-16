'use client';

import React, { useState } from 'react';
import { PackageSearch, Search, Plus, ShoppingBag, Trash2, CheckCircle2, Loader2, ImageOff, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/config';
import { useBusinessConfig } from '@/lib/business-config-context';
import { getResizedImageUrl } from '@/lib/cloudinary-image';
import { CatalogProduct, CartItem } from '@/lib/types/batch';

interface ProductPosCartProps {
  catalog: CatalogProduct[];
  cart: CartItem[];
  shippingFee: number;
  onAddToCart: (product: CatalogProduct) => void;
  onEditProduct?: (product: CatalogProduct) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onUpdateInlinePrice: (index: number, newPrice: number) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  isSubmitting?: boolean;
}

export default function ProductPosCart({
  catalog,
  cart,
  shippingFee,
  onAddToCart,
  onEditProduct,
  onUpdateQty,
  onUpdateInlinePrice,
  onClearCart,
  onSubmitOrder,
  isSubmitting = false,
}: ProductPosCartProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const config = useBusinessConfig();

  const fc = (amount: number) => formatCurrency(amount, config);

  const filteredCatalog = catalog.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + (shippingFee || 0);

  return (
    <div className="space-y-2 flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <PackageSearch className="w-4 h-4 text-amber-600" />
          <span>2. Pilih Produk & Edit Harga In-Line</span>
        </h3>
        <span className="text-[10px] text-gray-500">Edit harga langsung tanpa modal</span>
      </div>

      {/* Product Search & Category Filters */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Product Catalog Grid — photo-first cards so items are recognizable at a
          glance instead of scanning names, closer to how the bakery staff
          already picks products visually off the counter. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2.5 max-h-[380px] xl:max-h-[320px] overflow-y-auto pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="col-span-full text-center py-8 text-xs text-gray-400">
            {catalog.length === 0 ? 'Belum ada produk di katalog' : 'Tidak ada produk yang cocok'}
          </div>
        ) : (
          filteredCatalog.map((p) => {
            const thumb = getResizedImageUrl(p.imageUrl, 200, 200);
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onAddToCart(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAddToCart(p);
                  }
                }}
                className="bg-white hover:bg-amber-50/70 border border-amber-200/90 hover:border-amber-300 rounded-xl overflow-hidden transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between active:scale-[0.98] select-none text-left group min-h-[170px]"
              >
                {/* Photo container with fixed height so it never collapses */}
                <div className="h-24 sm:h-28 w-full bg-amber-50/80 relative overflow-hidden shrink-0 flex items-center justify-center border-b border-amber-100/60">
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumb}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-300/80 gap-1 p-2">
                      <ImageOff className="w-7 h-7 stroke-1 text-amber-300" />
                      <span className="text-[9px] text-amber-600/70 font-medium">Tanpa foto</span>
                    </div>
                  )}
                  {p.doughName && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-amber-900 bg-amber-100/95 border border-amber-300/60 px-1.5 py-0.5 rounded shadow-2xs max-w-[70%] truncate z-10">
                      {p.doughName}
                    </span>
                  )}
                  {onEditProduct && (
                    <button
                      type="button"
                      aria-label={`Edit produk ${p.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(p);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-amber-600 hover:text-white text-gray-700 rounded-lg shadow-xs transition z-10 border border-gray-200 hover:border-amber-600 cursor-pointer"
                      title={`Edit ${p.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Info and price */}
                <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1.5 w-full bg-white">
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-2 leading-snug group-hover:text-amber-950" title={p.name}>
                    {p.name}
                  </h4>
                  <div className="flex items-center justify-between gap-1 mt-auto pt-1.5 border-t border-gray-100">
                    <p className="text-xs font-extrabold text-amber-800 shrink-0">{fc(p.price)}</p>
                    <span className="text-[10px] bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-900 font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-0.5 shrink-0 shadow-2xs whitespace-nowrap">
                      <Plus className="w-3 h-3" /> Tambah
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Cart Area (Inline Price Input) */}
      <div className="mt-1.5 border-t pt-2 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-gray-800 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>Item Keranjang (Ubah Harga Langsung)</span>
          </h4>
          <button onClick={onClearCart} className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-0.5">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* Cart List */}
        <div className="max-h-[260px] xl:max-h-[170px] overflow-y-auto space-y-1.5 pr-1 border rounded-xl p-2 bg-gray-50/50 min-h-[85px] flex flex-col justify-center">
          {cart.length === 0 ? (
            <div className="text-center py-3 text-xs text-gray-400 flex flex-col items-center gap-1">
              <ShoppingBag className="w-5 h-5 stroke-1 text-gray-300" />
              <span>Keranjang kosong, pilih produk di atas</span>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="bg-white p-2 rounded-lg border border-gray-200 flex items-center justify-between text-xs shadow-2xs gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-800 line-clamp-1">{item.name}</span>
                    {item.isCustom && <span className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0.2 rounded font-bold">CUSTOM</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                    <span>Harga (Rp):</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onUpdateInlinePrice(idx, Number(e.target.value) || 0)}
                      className="w-20 px-1.5 py-0.5 bg-amber-50/80 font-bold text-amber-900 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded overflow-hidden bg-gray-50">
                    <button onClick={() => onUpdateQty(idx, -1)} className="min-w-[40px] min-h-[40px] xl:min-w-0 xl:min-h-0 px-2.5 py-1.5 xl:px-1.5 xl:py-0.5 hover:bg-gray-200 font-bold">-</button>
                    <span className="px-2 py-0.5 font-bold text-xs">{item.qty}</span>
                    <button onClick={() => onUpdateQty(idx, 1)} className="min-w-[40px] min-h-[40px] xl:min-w-0 xl:min-h-0 px-2.5 py-1.5 xl:px-1.5 xl:py-0.5 hover:bg-gray-200 font-bold">+</button>
                  </div>
                  <span className="font-extrabold text-amber-800 min-w-[65px] text-right">
                    {fc(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Submit */}
        <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span>Subtotal Produk:</span>
              <span className="font-semibold">{fc(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Ongkos Kirim:</span>
              <span className="font-semibold text-amber-800">{fc(shippingFee || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-900 border-t border-amber-200/80 pt-1">
              <span>Total Tagihan:</span>
              <span className="text-base text-amber-900 font-extrabold">{fc(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => onSubmitOrder()}
            disabled={isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 xl:py-2.5 rounded-xl text-sm xl:text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Order (Unpaid)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
