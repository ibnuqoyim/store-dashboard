'use client';

import React, { useState } from 'react';
import BatchPosHeader from './BatchPosHeader';
import CustomerShippingForm, { CustomerShippingData } from './CustomerShippingForm';
import ProductPosCart, { CatalogProduct, CartItem } from './ProductPosCart';
import NewProductModal from './NewProductModal';
import BatchOrdersList, { BatchOrder } from './BatchOrdersList';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';

const INITIAL_CATALOG: CatalogProduct[] = [
  { id: '1', name: 'Milk Bread', price: 40000, category: 'Sourdough' },
  { id: '2', name: 'Earl Grey CC Mini', price: 12500, category: 'Sweet Bread' },
  { id: '3', name: 'Chocobanana', price: 35000, category: 'Sweet Bread' },
  { id: '4', name: 'Burger Bun (Pack)', price: 35000, category: 'Sourdough' },
  { id: '5', name: 'Paket Mini Isi 4', price: 50000, category: 'Paket' },
  { id: '6', name: 'Paket Mini Isi 8', price: 100000, category: 'Paket' },
];

const INITIAL_ORDERS: BatchOrder[] = [
  {
    id: 'ORD-101',
    customerName: 'Pak Ahmad',
    phone: '08123456789',
    shipping: 'Ahsan',
    shippingFee: 15000,
    time: '08:30 WIB',
    items: [
      { productId: '1', name: 'Milk Bread', qty: 2, price: 40000, normalPrice: 40000, isCustom: false },
      { productId: '2', name: 'Earl Grey CC Mini', qty: 4, price: 12500, normalPrice: 12500, isCustom: false },
    ],
    subtotal: 130000,
    total: 145000,
    payStatus: 'PAID',
    payMethod: 'QRIS',
    orderStatus: 'READY',
  },
  {
    id: 'ORD-102',
    customerName: 'Ibu Siska',
    phone: '087722732214',
    shipping: 'TIKI',
    shippingFee: 20000,
    time: '09:15 WIB',
    items: [
      { productId: '6', name: 'Paket Mini Isi 8', qty: 1, price: 100000, normalPrice: 100000, isCustom: false },
    ],
    subtotal: 100000,
    total: 120000,
    payStatus: 'DP',
    payMethod: 'Transfer BCA',
    orderStatus: 'IN PREP',
  },
  {
    id: 'ORD-103',
    customerName: 'Warung Bu Maya',
    phone: '08198765432',
    shipping: 'COD',
    shippingFee: 0,
    time: '09:40 WIB',
    items: [
      { productId: '4', name: 'Burger Bun (Pack)', qty: 10, price: 30000, normalPrice: 35000, isCustom: true },
    ],
    subtotal: 300000,
    total: 300000,
    payStatus: 'UNPAID',
    payMethod: 'Cash',
    orderStatus: 'PENDING',
  },
];

export default function BatchPosLayoutClient() {
  const [activeBatch, setActiveBatch] = useState('BATCH-20260915-PAGI');
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Form & Cart States
  const [customerShipping, setCustomerShipping] = useState<CustomerShippingData>({
    customerName: '',
    customerPhone: '',
    shippingMethod: 'Ahsan',
    shippingFee: 15000,
  });

  const [catalog, setCatalog] = useState<CatalogProduct[]>(INITIAL_CATALOG);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>(INITIAL_ORDERS);

  const fc = (amount: number) => formatCurrency(amount, DEFAULT_CONFIG);

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

  const handleSaveNewProduct = (newProduct: CatalogProduct) => {
    setCatalog((prev) => [newProduct, ...prev]);
    alert(`Produk "${newProduct.name}" ditambahkan ke POS!`);
  };

  const handleSubmitOrder = (payStatus: 'PAID' | 'DP' | 'UNPAID', payMethod: 'QRIS' | 'Transfer BCA' | 'Cash') => {
    if (!customerShipping.customerName) {
      alert('Harap isi Nama Pembeli terlebih dahulu!');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal + customerShipping.shippingFee;

    const newOrder: BatchOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customerName: customerShipping.customerName,
      phone: customerShipping.customerPhone || '-',
      shipping: customerShipping.shippingMethod,
      shippingFee: customerShipping.shippingFee,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      items: structuredClone(cart),
      subtotal,
      total,
      payStatus,
      payMethod,
      orderStatus: 'PENDING',
    };

    setBatchOrders((prev) => [newOrder, ...prev]);
    handleClearCart();
    alert(`Order ${newOrder.id} berhasil ditambahkan ke ${activeBatch}!\nTotal: ${fc(total)}`);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'PENDING' | 'IN PREP' | 'READY') => {
    setBatchOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-2 sm:p-4 flex flex-col">
      <BatchPosHeader
        activeBatch={activeBatch}
        onBatchChange={setActiveBatch}
        currentCapacity={batchOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0)}
        maxCapacity={100}
        onOpenNewProductModal={() => setIsNewProductModalOpen(true)}
        onRefresh={() => alert('Data batch direfresh')}
      />

      {/* Main Content 3-Column Grid */}
      <main className="max-w-[1700px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: POS INPUT (Task 4, 5, 6) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex flex-col gap-3.5">
          <CustomerShippingForm data={customerShipping} onChange={setCustomerShipping} />
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

        {/* COLUMN 2: BATCH ORDERS LIST (Task 7) */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <BatchOrdersList
            orders={batchOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onPrintReceipt={(id) => alert(`Mencetak Struk untuk ${id}...`)}
          />
        </section>

        {/* COLUMN 3: BATCH & DOUGH RESUME (Task 8 - Container Shell) */}
        <section className="lg:col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">3. Rekap Batch & Adonan</h2>
          <p className="text-xs text-gray-400 mt-2">Container Resume Akumulasi Adonan Dapur (Task 8)</p>
        </section>
      </main>

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSaveProduct={handleSaveNewProduct}
      />
    </div>
  );
}
