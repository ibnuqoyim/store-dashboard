'use client';

import React, { useState, useEffect } from 'react';
import BatchPosHeader from './BatchPosHeader';
import CustomerShippingForm from './CustomerShippingForm';
import ProductPosCart from './ProductPosCart';
import NewProductModal from './NewProductModal';
import BatchOrdersList from './BatchOrdersList';
import BatchDoughResume from './BatchDoughResume';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';
import { CatalogProduct, CartItem, CustomerShippingData, BatchOrder, PayStatus, PayMethod, OrderStatus, BatchPO, Customer } from '@/lib/types/batch';
import { INITIAL_CATALOG, INITIAL_ORDERS, INITIAL_BATCH_POS, INITIAL_CUSTOMERS } from '@/lib/mock/batch-pos-mock';
import { createClient } from '@/utils/supabase/client';

interface BatchPosLayoutClientProps {
  initialBatchPO?: BatchPO[];
  initialCustomers?: Customer[];
  initialProducts?: CatalogProduct[];
}

export default function BatchPosLayoutClient({
  initialBatchPO = [],
  initialCustomers = [],
  initialProducts = [],
}: BatchPosLayoutClientProps) {
  const supabase = createClient();

  // Combine initial DB data with fallback mocks if DB is empty
  const [batchList, setBatchList] = useState<BatchPO[]>(
    initialBatchPO.length > 0 ? initialBatchPO : INITIAL_BATCH_POS
  );
  const [activeBatch, setActiveBatch] = useState<string>(
    initialBatchPO.length > 0 ? initialBatchPO[0].name : INITIAL_BATCH_POS[0].name
  );
  const [customerList, setCustomerList] = useState<Customer[]>(
    initialCustomers.length > 0 ? initialCustomers : INITIAL_CUSTOMERS
  );
  const [catalog, setCatalog] = useState<CatalogProduct[]>(
    initialProducts.length > 0 ? initialProducts : INITIAL_CATALOG
  );

  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Form & Cart States
  const [customerShipping, setCustomerShipping] = useState<CustomerShippingData>({
    customerName: '',
    customerPhone: '',
    shippingMethod: 'Ahsan',
    shippingFee: 15000,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>(INITIAL_ORDERS);

  const fc = (amount: number) => formatCurrency(amount, DEFAULT_CONFIG);

  // Synchronize state if props update from Server Component
  useEffect(() => {
    if (initialBatchPO.length > 0) {
      setBatchList(initialBatchPO);
      if (!activeBatch) setActiveBatch(initialBatchPO[0].name);
    }
    if (initialCustomers.length > 0) setCustomerList(initialCustomers);
    if (initialProducts.length > 0) setCatalog(initialProducts);
  }, [initialBatchPO, initialCustomers, initialProducts]);

  // Handler: Create New Batch PO (Sync to Supabase & Local state)
  const handleCreateNewBatch = async (newBatchName: string) => {
    const trimmed = newBatchName.trim();
    if (!trimmed) return;

    const exists = batchList.some((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert(`Batch PO "${trimmed}" sudah ada! Harap gunakan nama lain.`);
      return;
    }

    // Try inserting into Supabase batch_po table
    try {
      const { data, error } = await supabase
        .from('batch_po')
        .insert({ name: trimmed, description: 'Batch Pre-order Baru (POS)' })
        .select('id, name, description, created_at')
        .single();

      const newPO: BatchPO = data
        ? { id: data.id, name: data.name, description: data.description }
        : { id: `po-${Date.now()}`, name: trimmed, description: 'Batch Pre-order Baru' };

      setBatchList((prev) => [newPO, ...prev]);
      setActiveBatch(trimmed);
      alert(`Batch Pre-Order baru "${trimmed}" berhasil dibuat dan dipilih!`);
    } catch (err) {
      console.warn('Supabase insert batch_po fallback:', err);
      const newPO: BatchPO = { id: `po-${Date.now()}`, name: trimmed, description: 'Batch Pre-order Baru' };
      setBatchList((prev) => [newPO, ...prev]);
      setActiveBatch(trimmed);
    }
  };

  const handleBatchChange = (batchName: string) => {
    setActiveBatch(batchName);
  };

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

  const handleSaveNewProduct = async (newProduct: CatalogProduct) => {
    // Try saving product to Supabase DB
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          price: newProduct.price,
          category: newProduct.category,
        })
        .select('id, name, price, category')
        .single();

      const createdProd = data ? { ...newProduct, id: data.id } : newProduct;
      setCatalog((prev) => [createdProd, ...prev]);
      alert(`Produk "${newProduct.name}" berhasil dibuat dan tersimpan ke DB!`);
    } catch (err) {
      setCatalog((prev) => [newProduct, ...prev]);
      alert(`Produk "${newProduct.name}" ditambahkan ke katalog POS!`);
    }
  };

  const handleSubmitOrder = async (payStatus: PayStatus, payMethod: PayMethod) => {
    const trimmedCustomerName = customerShipping.customerName.trim();

    if (!trimmedCustomerName) {
      alert('Harap isi Nama Pembeli terlebih dahulu!');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    // Auto add customer to customerList and DB if not exists
    const exists = customerList.some(
      (c) => c.name.trim().toLowerCase() === trimmedCustomerName.toLowerCase()
    );
    if (!exists) {
      try {
        const { data } = await supabase
          .from('customers')
          .insert({
            name: trimmedCustomerName,
            phone: customerShipping.customerPhone,
            default_courier: customerShipping.shippingMethod,
          })
          .select('id, name, phone, default_courier')
          .single();

        const newCust: Customer = data
          ? { id: data.id, name: data.name, phone: data.phone, default_courier: data.default_courier }
          : { id: `c-${Date.now()}`, name: trimmedCustomerName, phone: customerShipping.customerPhone, default_courier: customerShipping.shippingMethod };

        setCustomerList((prev) => [newCust, ...prev]);
      } catch (err) {
        const newCust: Customer = {
          id: `c-${Date.now()}`,
          name: trimmedCustomerName,
          phone: customerShipping.customerPhone,
          default_courier: customerShipping.shippingMethod,
        };
        setCustomerList((prev) => [newCust, ...prev]);
      }
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal + customerShipping.shippingFee;
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: BatchOrder = {
      id: orderId,
      customerName: trimmedCustomerName,
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
        batchList={batchList}
        onBatchChange={handleBatchChange}
        onCreateNewBatch={handleCreateNewBatch}
        currentCapacity={batchOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0)}
        maxCapacity={100}
        onOpenNewProductModal={() => setIsNewProductModalOpen(true)}
        onRefresh={() => alert('Data batch direfresh')}
      />

      <main className="max-w-[1700px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: POS INPUT */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex flex-col gap-3.5">
          <CustomerShippingForm
            data={customerShipping}
            customerList={customerList}
            onChange={setCustomerShipping}
          />
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

        {/* COLUMN 2: BATCH ORDERS LIST */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <BatchOrdersList
            orders={batchOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onPrintReceipt={(id) => alert(`Mencetak Struk untuk ${id}...`)}
          />
        </section>

        {/* COLUMN 3: BATCH & DOUGH RESUME */}
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
