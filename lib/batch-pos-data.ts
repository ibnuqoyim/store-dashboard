import { BatchOrder, CartItem, OrderStatus, PayMethod, PayStatus, ShippingMethod } from './types/batch';

// Shape returned by the Supabase query in app/(dashboard)/batch-pos/page.tsx and
// the client-side refetch in BatchPosLayoutClient — kept close to the raw
// PostgREST response so both call sites can share this mapper. Supabase's
// generated types can't always tell a to-one join from a to-many one, so the
// nested `products` field is typed loosely and normalized below.
export interface DbOrderRow {
  id: string;
  invoice_number: string;
  customer_name: string;
  phone: string | null;
  shipping_method: string | null;
  shipping_fee: number | null;
  pay_status: string | null;
  pay_method: string | null;
  order_status: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    is_custom_price: boolean | null;
    products: { name: string; price: number } | { name: string; price: number }[] | null;
  }[];
}

function normalizeProduct(
  products: { name: string; price: number } | { name: string; price: number }[] | null
): { name: string; price: number } | null {
  if (!products) return null;
  return Array.isArray(products) ? products[0] ?? null : products;
}

export function mapDbOrderToBatchOrder(row: DbOrderRow): BatchOrder {
  const items: CartItem[] = (row.order_items || []).map((it) => {
    const product = normalizeProduct(it.products);
    return {
      productId: it.product_id,
      name: product?.name ?? 'Produk Dihapus',
      normalPrice: product?.price ?? it.price,
      price: it.price,
      qty: it.quantity,
      isCustom: it.is_custom_price ?? it.price !== (product?.price ?? it.price),
    };
  });

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shippingFee = row.shipping_fee || 0;

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerName: row.customer_name,
    phone: row.phone || '-',
    shipping: (row.shipping_method as ShippingMethod) || 'Ambil Sendiri',
    shippingFee,
    time: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    items,
    subtotal,
    total: subtotal + shippingFee,
    payStatus: (row.pay_status as PayStatus) || 'UNPAID',
    payMethod: (row.pay_method as PayMethod) || 'Cash',
    orderStatus: (row.order_status as OrderStatus) || 'PENDING',
  };
}

export const ORDER_ITEMS_SELECT = `
  id, invoice_number, customer_name, phone, shipping_method, shipping_fee,
  pay_status, pay_method, order_status, created_at,
  order_items ( id, product_id, quantity, price, is_custom_price, products ( name, price ) )
`;
