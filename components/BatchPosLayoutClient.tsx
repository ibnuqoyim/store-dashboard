'use client';

import React, { useState } from 'react';
import BatchPosHeader from './BatchPosHeader';
import CustomerShippingForm, { CustomerShippingData } from './CustomerShippingForm';
import ProductPosCart, { CatalogProduct, CartItem } from './ProductPosCart';

const INITIAL_CATALOG: CatalogProduct[] = [
  { id: '1', name: 'Milk Bread', price: 40000, category: 'Sourdough' },
  { id: '2', name: 'Earl Grey CC Mini', price: 12500, category: 'Sweet Bread' },
  { id: '3', name: 'Chocobanana', price: 35000, category: 'Sweet Bread' },
  { id: '4', name: 'Burger Bun (Pack)', price: 35000, category: 'Sourdough' },
  { id: '5', name: 'Paket Mini Isi 4', price: 50000, category: 'Paket' },
  { id: '6', name: 'Paket Mini Isi 8', price: 100000, category: 'Paket' },
];

export default function BatchPosLayoutClient() {
  const [activeBatch, setActiveBatch] = useState('BATCH-20260915-PAGI');
  
  // Task 4 State: Customer & Shipping
  const [customerShipping, setCustomerShipping] = useState<CustomerShippingData>({
    customerName: '',
    customerPhone: '',
    shippingMethod: 'Ahsan',
    shippingFee: 15000,
  });

  // Task 5 State: Catalog & Cart
  const [catalog] = useState<CatalogProduct[]>(INITIAL_CATALOG);
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleAddToCart = (product: CatalogProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.productId === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          normalPrice: product.price,
          price: product.price,
          qty: 1,
          isCustom: false,
        },
      ];
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].qty += delta;
      if (updated[index].qty <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const handleUpdateInlinePrice = (index: number, newPrice: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].price = newPrice;
      updated[index].isCustom = newPrice !== updated[index].normalPrice;
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerShipping({
      customerName: '',
      customerPhone: '',
      shippingMethod: 'Ahsan',
      shippingFee: 0,
    });
  };

  const handleSubmitOrder = (payStatus: string, payMethod: string) => {
    if (!customerShipping.customerName) {
      alert('Harap isi Nama Pembeli terlebih dahulu!');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const grandTotal = subtotal + customerShipping.shippingFee;

    alert(
      `Order Berhasil Disimpan ke ${activeBatch}!\nPembeli: ${customerShipping.customerName}\nKurir: ${customerShipping.shippingMethod} (Ongkir: Rp ${customerShipping.shippingFee.toLocaleString('id-ID')})\nTotal: Rp ${grandTotal.toLocaleString('id-ID')}`
    );
    handleClearCart();
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-2 sm:p-4 flex flex-col">
      <BatchPosHeader
        activeBatch={activeBatch}
        onBatchChange={setActiveBatch}
        currentCapacity={75}
        maxCapacity={100}
        onRefresh={() => alert('Data batch direfresh')}
      />

      {/* Main Content 3-Column Grid */}
      <main className="max-w-[1700px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: POS INPUT (Task 4 & Task 5 Integrated) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex flex-col gap-3.5">
          {/* STEP 1: Form Pembeli & Pengiriman (Task 4) */}
          <CustomerShippingForm
            data={customerShipping}
            onChange={setCustomerShipping}
          />

          {/* STEP 2: Katalog Produk & Keranjang Inline Edit (Task 5) */}
          <ProductPosCart
            catalog={catalog}
            cart={cart}
            shippingFee={customerShipping.shippingFee}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onUpdateInlinePrice={handleUpdateInlinePrice}
            onClearCart={handleClearCart}
            onSubmitOrder={handleSubmitOrder}
          />
        </section>

        {/* COLUMN 2: BATCH ORDERS LIST (4 Cols) */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">2. Daftar Order Batch</h2>
          <p className="text-xs text-gray-400 mt-2">Container List Pesanan dalam Batch (Task 7)</p>
        </section>

        {/* COLUMN 3: BATCH & DOUGH RESUME (3 Cols) */}
        <section className="lg:col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">3. Rekap Batch & Adonan</h2>
          <p className="text-xs text-gray-400 mt-2">Container Resume Akumulasi Adonan Dapur (Task 8)</p>
        </section>
      </main>
    </div>
  );
}
