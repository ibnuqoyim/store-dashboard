'use client';

import React, { useState, useMemo } from 'react';
import { ListChecks, Search, Printer, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/config';
import { useBusinessConfig } from '@/lib/business-config-context';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { BatchOrder, OrderStatus, PayStatus, ShippingMethod } from '@/lib/types/batch';

interface BatchOrdersListProps {
  orders: BatchOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePayStatus?: (orderId: string, newPayStatus: PayStatus) => void;
  isLoading?: boolean;
}

const SHIPPING_BADGE_MAP: Record<ShippingMethod, string> = {
  Ahsan: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  TIKI: 'bg-blue-100 text-blue-800 border-blue-300',
  COD: 'bg-orange-100 text-orange-800 border-orange-300',
  'Ambil Sendiri': 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function BatchOrdersList({
  orders,
  onUpdateOrderStatus,
  onUpdatePayStatus,
  isLoading = false,
}: BatchOrdersListProps) {
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const config = useBusinessConfig();
  const fc = (amount: number) => formatCurrency(amount, config);

  const handleDownloadStruk = async (order: BatchOrder) => {
    try {
      setDownloadingId(order.id);
      await generateInvoicePdf(
        {
          id: order.id,
          invoice_number: order.invoiceNumber,
          customer_name: order.customerName,
          phone: order.phone,
          date: order.date,
          shipping_fee: order.shippingFee,
          order_items: order.items.map((it) => ({
            name: it.name,
            price: it.price,
            quantity: it.qty,
          })),
        },
        config
      );
    } catch (err) {
      console.error('Error generating PDF struk:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchVal.toLowerCase().trim();
    return orders.filter((o) => {
      const matchSearch =
        !query ||
        o.customerName.toLowerCase().includes(query) ||
        o.invoiceNumber.toLowerCase().includes(query);
      const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchVal, statusFilter]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-800">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base">Daftar Order Batch</h2>
            <span className="text-xs text-gray-500">Total: {orders.length} Pesanan</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari nama / ID order..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | OrderStatus)}
          className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-1.5 font-medium"
        >
          <option value="ALL">Semua Status</option>
          <option value="PENDING">Pending ⏳</option>
          <option value="IN PREP">In Prep 🥣</option>
          <option value="READY">Ready 🟢</option>
        </select>
      </div>

      {/* Order Cards Container. On tablet/mobile (below xl) the scroll height is
          viewport-relative since this panel is full-width and full-height in its
          own tab: 260px accounts for the sticky header + tab bar + section
          padding above it. At xl+ it sits beside the other two columns, so a
          fixed height matches their layout instead. */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[calc(100vh-260px)] xl:max-h-[580px]">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-gray-400">Memuat order...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">Tidak ada order yang cocok</div>
        ) : (
          filteredOrders.map((o) => {
            const payBadgeClass =
              o.payStatus === 'PAID'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : o.payStatus === 'DP'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-red-100 text-red-800 border-red-300';

            const shippingBadgeClass = SHIPPING_BADGE_MAP[o.shipping] || 'bg-gray-100 text-gray-800 border-gray-300';

            return (
              <div
                key={o.id}
                className="bg-gray-50/80 hover:bg-white border border-gray-200 rounded-xl p-3 transition shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{o.invoiceNumber}</span>
                    <span className="text-[10px] text-gray-400">• {o.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${shippingBadgeClass}`}>
                      🚚 {o.shipping}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${payBadgeClass}`}>
                      {o.payStatus}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{o.customerName}</p>
                    <p className="text-[11px] text-gray-500">{o.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-800 block">{fc(o.total)}</span>
                    {o.shippingFee > 0 && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        (Ongkir {fc(o.shippingFee)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Items detail list */}
                <div className="bg-white p-2 rounded-lg border border-gray-100 text-[11px] space-y-1">
                  {o.items.map((it, idx) => (
                    <div key={`${it.productId}-${idx}`} className="flex justify-between text-gray-600">
                      <span>
                        {it.qty}x {it.name}{' '}
                        {it.isCustom && <span className="text-[9px] text-amber-700 font-semibold">(Custom Price)</span>}
                      </span>
                      <span>{fc(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Order Status & Pay Status Changer & Quick Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Status:</span>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="bg-white border border-gray-300 rounded font-semibold text-[11px] p-1.5 xl:p-1 cursor-pointer"
                      >
                        <option value="PENDING">PENDING ⏳</option>
                        <option value="IN PREP">IN PREP 🥣</option>
                        <option value="READY">READY 🟢</option>
                      </select>
                    </div>

                    {onUpdatePayStatus && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Bayar:</span>
                        <select
                          value={o.payStatus}
                          onChange={(e) => onUpdatePayStatus(o.id, e.target.value as PayStatus)}
                          className={`border rounded font-bold text-[11px] p-1.5 xl:p-1 cursor-pointer ${
                            o.payStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : o.payStatus === 'DP'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="PAID">PAID (Lunas)</option>
                          <option value="DP">DP (Uang Muka)</option>
                          <option value="UNPAID">UNPAID (Belum)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={downloadingId === o.id}
                    onClick={() => handleDownloadStruk(o)}
                    className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-bold transition disabled:opacity-50 cursor-pointer"
                    title="Download Invoice PDF"
                  >
                    {downloadingId === o.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800" />
                    ) : (
                      <Printer className="w-3.5 h-3.5 text-amber-800" />
                    )}
                    <span>{downloadingId === o.id ? 'Mengunduh...' : 'Struk PDF'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
