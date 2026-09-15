'use client';

import React, { useState } from 'react';
import { Store, Layers, RefreshCw, PlusCircle, CalendarPlus } from 'lucide-react';
import { BatchPO } from '@/lib/types/batch';

interface BatchPosHeaderProps {
  activeBatch: string;
  batchList: BatchPO[];
  onBatchChange: (batchName: string) => void;
  onCreateNewBatch: (newBatchName: string) => void;
  currentCapacity: number;
  maxCapacity: number;
  onOpenNewProductModal?: () => void;
  onRefresh?: () => void;
}

export default function BatchPosHeader({
  activeBatch,
  batchList,
  onBatchChange,
  onCreateNewBatch,
  currentCapacity = 75,
  maxCapacity = 100,
  onOpenNewProductModal,
  onRefresh,
}: BatchPosHeaderProps) {
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchInput, setNewBatchInput] = useState('');

  const percentage = Math.min(Math.round((currentCapacity / maxCapacity) * 100), 100);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchInput.trim()) return;
    const name = newBatchInput.startsWith('#') ? newBatchInput.trim() : `#${newBatchInput.trim()}`;
    onCreateNewBatch(name);
    setNewBatchInput('');
    setIsCreatingBatch(false);
  };

  return (
    <header className="bg-amber-900 text-white shadow-md sticky top-0 z-30 rounded-xl mb-4">
      <div className="max-w-[1700px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-700/60 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <span className="text-xs text-amber-200 uppercase font-semibold tracking-wider block">Store Dashboard</span>
            <h1 className="text-lg font-bold flex items-center gap-2">
              POS Batch Manager
            </h1>
          </div>
        </div>

        {/* Batch Selector & Info */}
        <div className="flex items-center gap-4 bg-amber-800/80 px-4 py-2 rounded-xl border border-amber-700">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-300" />
            <span className="text-xs text-amber-200 font-semibold">Target Batch PO:</span>
            {isCreatingBatch ? (
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newBatchInput}
                  onChange={(e) => setNewBatchInput(e.target.value)}
                  placeholder="Nama Batch Baru (mis: #BATCH-SABTU)..."
                  className="bg-white text-gray-900 font-bold text-xs px-2.5 py-1 rounded-lg focus:outline-none w-56"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs px-2 py-1 rounded-lg"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(false)}
                  className="text-amber-200 text-xs px-1 hover:text-white"
                >
                  Batal
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={activeBatch}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setIsCreatingBatch(true);
                    } else {
                      onBatchChange(e.target.value);
                    }
                  }}
                  className="bg-amber-900 text-white font-bold text-xs px-3 py-1 rounded-lg border border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {batchList.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__">+ Buat Batch PO Baru...</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(true)}
                  className="p-1 bg-amber-700/60 hover:bg-amber-600 rounded-lg text-amber-200 transition"
                  title="Tambah Batch PO Baru"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-amber-700"></div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> IN PRODUCTION
            </span>
          </div>
          <div className="h-6 w-px bg-amber-700"></div>
          <div className="text-xs">
            <span className="text-amber-300">Kapasitas:</span>
            <span className="font-bold text-white ml-1">{currentCapacity}/{maxCapacity} Pcs ({percentage}%)</span>
            <div className="w-24 bg-amber-950 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewProductModal && (
            <button
              onClick={onOpenNewProductModal}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Produk Baru</span>
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-amber-800 hover:bg-amber-700 text-amber-100 p-2 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
