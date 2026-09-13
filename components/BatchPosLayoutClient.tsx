'use client';

import React, { useState } from 'react';
import BatchPosHeader from './BatchPosHeader';

export default function BatchPosLayoutClient() {
  const [activeBatch, setActiveBatch] = useState('BATCH-20260915-PAGI');

  return (
    <div className="min-h-screen bg-amber-50/30 p-2 sm:p-4 flex flex-col">
      <BatchPosHeader
        activeBatch={activeBatch}
        onBatchChange={setActiveBatch}
        currentCapacity={75}
        maxCapacity={100}
        onRefresh={() => alert('Data batch direfresh')}
      />

      {/* Main Content 3-Column Grid */}
      <main className="max-w-[1700px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1: POS INPUT (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">1. Form POS (Order Baru)</h2>
          <p className="text-xs text-gray-400 mt-2">Container Form Input POS Pembeli & Produk (Task 4 & 5)</p>
        </section>

        {/* COLUMN 2: BATCH ORDERS LIST (4 Cols) */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">2. Daftar Order Batch</h2>
          <p className="text-xs text-gray-400 mt-2">Container List Pesanan dalam Batch (Task 7)</p>
        </section>

        {/* COLUMN 3: BATCH & DOUGH RESUME (3 Cols) */}
        <section className="lg:col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-amber-100 min-h-[500px]">
          <h2 className="font-bold text-gray-800 text-base border-b pb-2">3. Rekap Batch & Adonan</h2>
          <p className="text-xs text-gray-400 mt-2">Container Resume Akumulasi Adonan Dapur (Task 8)</p>
        </section>
      </main>
    </div>
  );
}
