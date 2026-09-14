'use client';

import React, { useState, useMemo } from 'react';
import { ListChecks, Search, Printer } from 'lucide-react';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';
import { BatchOrder, OrderStatus } from '@/lib/types/batch';

interface BatchOrdersListProps {
  orders: BatchOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onPrintReceipt?: (orderId: string) => void;
}

export default function BatchOrdersList({
  orders,
  onUpdateOrderStatus,
  onPrintReceipt,
}: BatchOrdersListProps) {
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fc = (amount: number) => formatCurrency(amount, DEFAULT_CONFIG);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.customerName.toLowerCase().includes(searchVal.toLowerCase()) ||
        o.id.toLowerCase().includes(searchVal.toLowerCase());
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
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-1.5 font-medium"
        >
          <option value="ALL">Semua Status</option>
          <option value="PENDING">Pending ⏳</option>
          <option value="IN PREP">In Prep 🥣</option>
          <option value="READY">Ready 🟢</option>
        </select>
      </div>

      {/* Order Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[580px]">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">Tidak ada order yang cocok</div>
        ) : (
          filteredOrders.map((o) => {
            const payBadgeClass =
              o.payStatus === 'PAID'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : o.payStatus === 'DP'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-red-100 text-red-800 border-red-300';

            const shippingBadgeClass =
              o.shipping === 'Ahsan'
                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                : o.shipping === 'TIKI'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : o.shipping === 'COD'
                ? 'bg-orange-100 text-orange-800 border-orange-300'
                : 'bg-gray-100 text-gray-800 border-gray-300';

            return (
              <div
                key={o.id}
                className="bg-gray-50/80 hover:bg-white border border-gray-200 rounded-xl p-3 transition shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{o.id}</span>
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

                {/* Order Status Changer & Quick Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                      className="bg-white border border-gray-300 rounded font-semibold text-[11px] p-1"
                    >
                      <option value="PENDING">PENDING ⏳</option>
                      <option value="IN PREP">IN PREP 🥣</option>
                      <option value="READY">READY 🟢</option>
                    </select>
                  </div>
                  <button
                    onClick={() => onPrintReceipt && onPrintReceipt(o.id)}
                    className="text-gray-500 hover:text-gray-700 text-[11px] flex items-center gap-1 font-medium"
                  >
                    <Printer className="w-3.5 h-3.5" /> Struk
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
