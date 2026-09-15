'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, ShoppingCart, ChefHat } from 'lucide-react';
import BatchPosHeader from './BatchPosHeader';
import CustomerShippingForm from './CustomerShippingForm';
import ProductPosCart from './ProductPosCart';
import NewProductModal from './NewProductModal';
import BatchOrdersList from './BatchOrdersList';
import BatchDoughResume from './BatchDoughResume';
import { createClient } from '@/utils/supabase/client';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';
import { mapDbOrderToBatchOrder, ORDER_ITEMS_SELECT, DbOrderRow } from '@/lib/batch-pos-data';
import {
  CatalogProduct,
  CartItem,
  CustomerShippingData,
  BatchOrder,
  PayStatus,
  PayMethod,
  OrderStatus,
  BatchPO,
  Customer,
  Dough,
} from '@/lib/types/batch';

type PosTab = 'pos' | 'orders' | 'resume';

interface BatchPosLayoutClientProps {
  initialBatchList: BatchPO[];
  initialActiveBatchId: string | null;
  initialCustomers: Customer[];
  initialCatalog: CatalogProduct[];
  initialOrders: BatchOrder[];
  doughs: Dough[];
}

export default function BatchPosLayoutClient({
  initialBatchList,
  initialActiveBatchId,
  initialCustomers,
  initialCatalog,
  initialOrders,
  doughs,
}: BatchPosLayoutClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [batchList, setBatchList] = useState<BatchPO[]>(initialBatchList);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(initialActiveBatchId);
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(initialCatalog);
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>(initialOrders);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<PosTab>('pos');

  const activeBatch = batchList.find((b) => b.id === activeBatchId);

  // Form & Cart States
  const [customerShipping, setCustomerShipping] = useState<CustomerShippingData>({
    customerName: '',
    customerPhone: '',
    shippingMethod: 'Ahsan',
    shippingFee: 15000,
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const fc = (amount: number) => formatCurrency(amount, DEFAULT_CONFIG);

  const fetchOrdersForBatch = async (batchId: string) => {
    setIsLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_ITEMS_SELECT)
      .eq('po_id', batchId)
      .order('created_at', { ascending: false });
    setIsLoadingOrders(false);

    if (error) {
      alert('Gagal memuat order batch: ' + error.message);
      return;
    }
    setBatchOrders(((data || []) as unknown as DbOrderRow[]).map(mapDbOrderToBatchOrder));
  };

  const handleCreateNewBatch = async (newBatchName: string) => {
    const trimmed = newBatchName.trim();
    if (!trimmed) return;

    const exists = batchList.some((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert(`Batch PO "${trimmed}" sudah ada! Harap gunakan nama lain.`);
      return;
    }

    const { data, error } = await supabase
      .from('batch_po')
      .insert({ name: trimmed, description: 'Batch Pre-order Baru' })
      .select('id, name, description, created_at')
      .single();

    if (error || !data) {
      alert('Gagal membuat Batch PO: ' + (error?.message ?? 'unknown error'));
      return;
    }

    setBatchList((prev) => [data, ...prev]);
    setActiveBatchId(data.id);
    setBatchOrders([]);
    router.refresh();
  };

  const handleBatchChange = async (batchId: string) => {
    setActiveBatchId(batchId);
    await fetchOrdersForBatch(batchId);
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

  const handleSaveNewProduct = (newProduct: CatalogProduct) => {
    setCatalog((prev) => [newProduct, ...prev]);
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    const now = new Date();
    const currentYYYYMM = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, '0');
    const { data: orders } = await supabase
      .from('orders')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(50);

    let maxSeq = 0;
    (orders || []).forEach((o) => {
      const num = o.invoice_number as string;
      if (num.startsWith(currentYYYYMM)) {
        const seq = parseInt(num.slice(6), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    return `${currentYYYYMM}${String(maxSeq + 1).padStart(3, '0')}`;
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
    if (!activeBatchId) {
      alert('Pilih atau buat Batch PO terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Reuse existing customer, or create it in the shared `customers` table
      let customerId = customerShipping.customerId ?? null;
      if (!customerId) {
        const existing = customerList.find(
          (c) => c.name.trim().toLowerCase() === trimmedCustomerName.toLowerCase()
        );
        if (existing) {
          customerId = existing.id;
        } else {
          const { data: newCust, error: custError } = await supabase
            .from('customers')
            .insert({
              name: trimmedCustomerName,
              phone: customerShipping.customerPhone || null,
              default_courier: customerShipping.shippingMethod,
            })
            .select('id, name, phone, address, default_courier')
            .single();
          if (custError) throw custError;
          customerId = newCust.id;
          setCustomerList((prev) => [newCust, ...prev]);
        }
      }

      const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

      // 2. Insert into the real orders table, linked to the active Batch PO.
      // invoice_number is only unique-guaranteed by the DB constraint, so on a
      // concurrent-write collision (Postgres 23505) we regenerate and retry
      // rather than risk two operators silently colliding on the same number.
      let newOrder: { id: string } | null = null;
      let invoiceNumber = '';
      const MAX_INVOICE_ATTEMPTS = 3;
      for (let attempt = 0; attempt < MAX_INVOICE_ATTEMPTS; attempt++) {
        invoiceNumber = await generateInvoiceNumber();
        const { data, error: orderError } = await supabase
          .from('orders')
          .insert({
            invoice_number: invoiceNumber,
            date: new Date().toISOString().split('T')[0],
            customer_id: customerId,
            customer_name: trimmedCustomerName,
            phone: customerShipping.customerPhone || null,
            status: payStatus === 'PAID' ? 'paid' : 'pending',
            po_id: activeBatchId,
            shipping_method: customerShipping.shippingMethod,
            shipping_fee: customerShipping.shippingFee,
            pay_status: payStatus,
            pay_method: payMethod,
            order_status: 'PENDING',
          })
          .select('id')
          .single();

        if (!orderError) {
          newOrder = data;
          break;
        }
        // 23505 = unique_violation — another order grabbed this invoice number first, retry.
        if (orderError.code !== '23505' || attempt === MAX_INVOICE_ATTEMPTS - 1) {
          throw orderError;
        }
      }
      if (!newOrder) {
        throw new Error('Gagal membuat nomor invoice unik setelah beberapa percobaan, coba lagi.');
      }

      // 3. Insert order items (feeds Products/Financial/Adonan via existing triggers)
      const itemsPayload = cart.map((item) => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.qty,
        price: item.price,
        is_custom_price: item.isCustom,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      // 4. Delivery record so the order shows up in the Deliveries module too
      if (customerShipping.shippingMethod !== 'Ambil Sendiri') {
        const customer = customerList.find((c) => c.id === customerId);
        await supabase.from('deliveries').insert({
          order_id: newOrder.id,
          courier_name: customerShipping.shippingMethod,
          shipping_cost: customerShipping.shippingFee,
          address: customer?.address || '',
          status: 'pending',
        });
      }

      await fetchOrdersForBatch(activeBatchId);
      handleClearCart();
      router.refresh();
      setActiveTab('orders');
      alert(`Order ${invoiceNumber} berhasil ditambahkan ke ${activeBatch?.name ?? 'batch ini'}!\nTotal: ${fc(subtotal + customerShipping.shippingFee)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
      alert('Gagal menyimpan order: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const previous = batchOrders;
    setBatchOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
    const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId);
    if (error) {
      setBatchOrders(previous);
      alert('Gagal mengubah status order: ' + error.message);
    }
  };

  const orderCount = useMemo(() => batchOrders.length, [batchOrders]);
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

  const TABS: { id: PosTab; label: string; icon: typeof ShoppingCart; badge?: number }[] = [
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, badge: cartCount || undefined },
    { id: 'orders', label: 'Order Batch', icon: ClipboardList, badge: orderCount || undefined },
    { id: 'resume', label: 'Rekap Adonan', icon: ChefHat },
  ];

  // Below `xl` only the active tab's panel is shown (display: none on the rest);
  // at `xl`+ all three are always visible as grid columns. Centralized here so the
  // three <section> elements below don't repeat near-identical template literals.
  const panelClass = (tab: PosTab, xlColSpan: string) =>
    `${activeTab === tab ? 'flex' : 'hidden'} xl:flex ${xlColSpan} bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex-col gap-3.5`;

  return (
    <div className="min-h-screen bg-amber-50/30 p-2 sm:p-4 flex flex-col">
      <BatchPosHeader
        activeBatchId={activeBatchId}
        batchList={batchList}
        onBatchChange={handleBatchChange}
        onCreateNewBatch={handleCreateNewBatch}
        currentCapacity={batchOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0)}
        maxCapacity={activeBatch ? 100 : 100}
        onOpenNewProductModal={() => setIsNewProductModalOpen(true)}
        onRefresh={() => activeBatchId && fetchOrdersForBatch(activeBatchId)}
      />

      {/* Tab switcher — only shown below the xl breakpoint (phones & tablets, incl.
          iPad portrait/landscape) where 3 side-by-side columns don't fit comfortably.
          Panels stay mounted (just hidden) so cart/form state survives tab switches. */}
      <div className="xl:hidden sticky top-0 z-20 bg-amber-50/95 backdrop-blur -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 mb-3 border-b border-amber-200">
        <div className="max-w-[1700px] mx-auto grid grid-cols-3 gap-2">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition relative ${
                activeTab === id
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'bg-white text-amber-900 border border-amber-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {!!badge && (
                <span
                  className={`ml-0.5 text-[10px] font-extrabold rounded-full px-1.5 min-w-[18px] text-center ${
                    activeTab === id ? 'bg-amber-500 text-amber-950' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1700px] mx-auto w-full flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Breakpoint intentionally raised from lg (1024px) to xl (1280px): most
            tablets — including iPad landscape at 1024-1180px — are narrower than
            1280px, so a 3-way lg:grid-cols-12 split still left each column too
            cramped to use. The tab switcher above covers everything under xl. */}
        {/* COLUMN 1: POS INPUT */}
        <section className={panelClass('pos', 'xl:col-span-5')}>
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
            isSubmitting={isSubmitting}
          />
        </section>

        {/* COLUMN 2: BATCH ORDERS LIST */}
        <section className={`${panelClass('orders', 'xl:col-span-4')} min-h-[500px]`}>
          <BatchOrdersList
            orders={batchOrders}
            isLoading={isLoadingOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onPrintReceipt={(id) => router.push(`/orders/${id}`)}
          />
        </section>

        {/* COLUMN 3: BATCH & DOUGH RESUME */}
        <section className={`${panelClass('resume', 'xl:col-span-3')} min-h-[500px]`}>
          <BatchDoughResume orders={batchOrders} activeBatchName={activeBatch?.name ?? 'Belum ada Batch PO'} />
        </section>
      </main>

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSaveProduct={handleSaveNewProduct}
        doughs={doughs}
      />
    </div>
  );
}
