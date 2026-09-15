// DUMMY DATA FOR BATCH POS DEMO — Remove or replace with Supabase sync in production
import { CatalogProduct, BatchOrder, Customer, BatchPO } from '@/lib/types/batch';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Pak Ahmad (Subang)', phone: '087722732214', address: 'Jl. Raya Subang No. 12', default_courier: 'Ahsan' },
  { id: 'c2', name: 'Ibu Siska (Bandung)', phone: '081234567890', address: 'Jl. Dago Atas No. 45', default_courier: 'TIKI' },
  { id: 'c3', name: 'Mas Budi (Jakarta)', phone: '081987654321', address: 'Jl. Sudirman Kav 5', default_courier: 'COD' },
  { id: 'c4', name: 'Teh Rina (Bogor)', phone: '085678901234', address: 'Jl. Pajajaran No. 8', default_courier: 'Ambil Sendiri' },
];

export const INITIAL_BATCH_POS: BatchPO[] = [
  { id: 'b1', name: '#BATCH-20260915-PAGI (Utama)', description: 'Batch Sourdough Pagi Subang' },
  { id: 'b2', name: '#BATCH-20260915-SIANG (Siang)', description: 'Batch Sweet Bread Siang' },
  { id: 'b3', name: '#BATCH-20260916-PAGI (Besok)', description: 'Pre-order Besok Pagi' },
];

export const INITIAL_CATALOG: CatalogProduct[] = [
  { id: '1', name: 'Milk Bread', price: 40000, category: 'Sourdough', doughRecipe: 'Soft Bread Base (120g/unit)' },
  { id: '2', name: 'Earl Grey CC Mini', price: 12500, category: 'Sweet Bread', doughRecipe: 'Sweet Dough Base (90g/unit)' },
  { id: '3', name: 'Chocobanana', price: 35000, category: 'Sweet Bread', doughRecipe: 'Soft Bread Base (120g/unit)' },
  { id: '4', name: 'Burger Bun (Pack)', price: 35000, category: 'Sourdough', doughRecipe: 'Soft Bread Base (120g/unit)' },
  { id: '5', name: 'Paket Mini Isi 4', price: 50000, category: 'Paket', doughRecipe: 'Sweet Dough Base (90g/unit)' },
  { id: '6', name: 'Paket Mini Isi 8', price: 100000, category: 'Paket', doughRecipe: 'Sweet Dough Base (90g/unit)' },
];

export const INITIAL_ORDERS: BatchOrder[] = [
  {
    id: 'ORD-101',
    customerName: 'Pak Ahmad (Subang)',
    phone: '087722732214',
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
    customerName: 'Ibu Siska (Bandung)',
    phone: '081234567890',
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
    customerName: 'Mas Budi (Jakarta)',
    phone: '081987654321',
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
