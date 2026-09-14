// DUMMY DATA FOR BATCH POS DEMO — Remove or replace with Supabase sync in production
import { CatalogProduct, BatchOrder } from '@/lib/types/batch';

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
    customerName: 'Pelanggan Demo A',
    phone: '081234567890',
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
    customerName: 'Pelanggan Demo B',
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
    customerName: 'Pelanggan Demo C',
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
