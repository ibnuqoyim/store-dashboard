'use client';

import React, { useState } from 'react';
import BatchPosHeader from './BatchPosHeader';
import CustomerShippingForm from './CustomerShippingForm';
import ProductPosCart from './ProductPosCart';
import NewProductModal from './NewProductModal';
import BatchOrdersList from './BatchOrdersList';
import BatchDoughResume from './BatchDoughResume';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';
import { CatalogProduct, CartItem, CustomerShippingData, BatchOrder, PayStatus, PayMethod, OrderStatus } from '@/lib/types/batch';
import { INITIAL_CATALOG, INITIAL_ORDERS } from '@/lib/mock/batch-pos-mock';

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

  const handleSubmitOrder = (payStatus: PayStatus, payMethod: PayMethod) => {
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

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: BatchOrder = {
      id: orderId,
      customerName: customerShipping.customerName,
      phone: customerShipping.customerPhone || '-',
      shipping: customerShipping.shippingMethod,
      shippingFee: customerShipping.shippingFee,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      items: cart.map((i) => ({ ...i })),
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

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
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

        {/* COLUMN 3: BATCH & DOUGH RESUME (Task 8) */}
        <section className="lg:col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <BatchDoughResume orders={batchOrders} activeBatch={activeBatch} />
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
