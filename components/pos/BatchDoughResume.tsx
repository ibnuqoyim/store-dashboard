'use client';

import React, { useMemo } from 'react';
import { ChefHat, Wheat, Droplets, Sparkles, Cookie, AlertCircle } from 'lucide-react';
import { DEFAULT_CONFIG, formatCurrency } from '@/lib/config';
import { BatchOrder } from '@/lib/types/batch';
import { BatchDoughCalculatorService, OrderCreatePayload } from '@/lib/batch-dough-calculator';

interface BatchDoughResumeProps {
  orders: BatchOrder[];
  activeBatchName: string;
}

// Move formatCurrency helper to module scope to avoid re-allocation on every render
const fc = (amount: number) => formatCurrency(amount, DEFAULT_CONFIG);

export default function BatchDoughResume({ orders, activeBatchName }: BatchDoughResumeProps) {
  // Transform BatchOrder array to OrderCreatePayload for BatchDoughCalculatorService
  const reqSummary = useMemo(() => {
    const payloadOrders: OrderCreatePayload[] = orders.map((o) => ({
      batchId: activeBatchName,
      customerName: o.customerName,
      customerPhone: o.phone,
      shippingMethod: o.shipping,
      shippingFee: o.shippingFee,
      payStatus: o.payStatus,
      payMethod: o.payMethod,
      items: o.items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        qty: i.qty,
        unitPrice: i.price,
        isCustomPrice: i.isCustom,
      })),
    }));

    return BatchDoughCalculatorService.calculateBatchRequirements(payloadOrders);
  }, [orders, activeBatchName]);

  // Summarize Product Item Totals aggregated by productId for accuracy
  const productSummary = useMemo(() => {
    const summaryMap: Record<string, { productId: string; name: string; qty: number; totalPrice: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        const key = it.productId || it.name;
        if (!summaryMap[key]) {
          summaryMap[key] = { productId: it.productId, name: it.name, qty: 0, totalPrice: 0 };
        }
        summaryMap[key].qty += it.qty;
        summaryMap[key].totalPrice += it.price * it.qty;
      });
    });
    return Object.values(summaryMap);
  }, [orders]);

  const totalBatchPcs = useMemo(
    () => orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0),
    [orders]
  );

  // Total Revenue (excl. shipping fee for pure product sales revenue accuracy)
  const totalProductRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.subtotal, 0),
    [orders]
  );

  return (
    <div className="flex flex-col gap-3.5 h-full">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base">3. Rekap Batch & Adonan</h2>
            <span className="text-xs text-amber-800 font-semibold">{activeBatchName}</span>
          </div>
        </div>
      </div>

      {/* Batch Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          <span className="text-[10px] text-amber-800 uppercase tracking-wider font-bold">Total Roti / Pcs</span>
          <p className="text-lg font-extrabold text-amber-950 mt-0.5">{totalBatchPcs} <span className="text-xs font-normal">Pcs</span></p>
        </div>
        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
          <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">Omzet Produk (Net)</span>
          <p className="text-sm font-extrabold text-emerald-950 mt-1">{fc(totalProductRevenue)}</p>
        </div>
      </div>

      {/* RAW INGREDIENT REQUIREMENTS (Kalkulasi Otomatis Dapur) */}
      <div className="bg-gradient-to-br from-amber-900 to-amber-950 text-white p-3.5 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
            <Wheat className="w-4 h-4 text-amber-400" />
            <span>Adonan & Bahan Mentah Dapur</span>
          </h3>
          <span className="text-[10px] bg-amber-800 text-amber-200 px-1.5 py-0.5 rounded font-bold">
            {reqSummary.baseDoughName || 'Sourdough Base'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-amber-900/60 p-2 rounded-lg border border-amber-800/60">
            <span className="text-[10px] text-amber-300 block">Total Berat Adonan</span>
            <span className="text-sm font-extrabold text-white">{reqSummary.totalWeightKg || 0} Kg</span>
          </div>
          <div className="bg-amber-900/60 p-2 rounded-lg border border-amber-800/60">
            <span className="text-[10px] text-amber-300 block">Tepung (Flour)</span>
            <span className="text-sm font-extrabold text-white">{reqSummary.ingredients?.flourKg || 0} Kg</span>
          </div>
          <div className="bg-amber-900/60 p-2 rounded-lg border border-amber-800/60">
            <span className="text-[10px] text-amber-300 block flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-300" /> Air (Water)
            </span>
            <span className="text-xs font-bold text-white">{reqSummary.ingredients?.waterLiter || 0} Liter</span>
          </div>
          <div className="bg-amber-900/60 p-2 rounded-lg border border-amber-800/60">
            <span className="text-[10px] text-amber-300 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Levain Aktif
            </span>
            <span className="text-xs font-bold text-white">{reqSummary.ingredients?.levainActiveKg || 0} Kg</span>
          </div>
        </div>

        {/* Fillings summary if available */}
        {((reqSummary.fillings?.creamCheeseKg ?? 0) > 0 || (reqSummary.fillings?.chocoChipsKg ?? 0) > 0) && (
          <div className="border-t border-amber-800/80 pt-2 text-[11px] space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wide">Kebutuhan Isian / Filling:</span>
            <div className="flex flex-wrap gap-2">
              {(reqSummary.fillings?.creamCheeseKg ?? 0) > 0 && (
                <span className="bg-amber-800/80 px-2 py-0.5 rounded text-amber-100 font-medium">
                  🧀 Cream Cheese: {reqSummary.fillings?.creamCheeseKg} Kg
                </span>
              )}
              {(reqSummary.fillings?.chocoChipsKg ?? 0) > 0 && (
                <span className="bg-amber-800/80 px-2 py-0.5 rounded text-amber-100 font-medium">
                  🍫 Choco Chips: {reqSummary.fillings?.chocoChipsKg} Kg
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ITEM PRODUCT BREAKDOWN TABLE */}
      <div className="flex-1 space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Cookie className="w-4 h-4 text-amber-600" />
          <span>Resume Per Produk</span>
        </h3>

        <div className="border rounded-xl bg-gray-50/50 p-2 text-xs space-y-1.5 max-h-[320px] xl:max-h-[220px] overflow-y-auto">
          {productSummary.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">Belum ada item di batch ini</div>
          ) : (
            productSummary.map((p) => (
              <div key={p.productId || p.name} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                <div>
                  <span className="font-bold text-gray-800 block">{p.name}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{p.qty} Pcs diproduksi</span>
                </div>
                <span className="font-extrabold text-amber-900">{fc(p.totalPrice)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>Kalkulasi adonan terhubung langsung secara real-time dengan seluruh item order di batch ini.</span>
      </div>
    </div>
  );
}
