export type PayStatus = 'PAID' | 'DP' | 'UNPAID';
export type PayMethod = 'QRIS' | 'Transfer BCA' | 'Cash';
export type OrderStatus = 'PENDING' | 'IN PREP' | 'READY';
export type ShippingMethod = 'Ahsan' | 'TIKI' | 'COD' | 'Ambil Sendiri';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  doughId?: string | null;
  doughName?: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  normalPrice: number;
  price: number;
  qty: number;
  isCustom: boolean;
}

export interface CustomerShippingData {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  shippingMethod: ShippingMethod;
  shippingFee: number;
}

export interface BatchOrder {
  id: string;
  invoiceNumber: string;
  customerName: string;
  phone: string;
  shipping: ShippingMethod;
  shippingFee: number;
  time: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  payStatus: PayStatus;
  payMethod: PayMethod;
  orderStatus: OrderStatus;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  default_courier?: string | null;
}

export interface BatchPO {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface Dough {
  id: string;
  name: string;
}
