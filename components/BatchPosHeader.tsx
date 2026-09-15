'use client';

import React, { useState } from 'react';
import { Store, Layers, RefreshCw, PlusCircle, CalendarPlus, Loader2 } from 'lucide-react';
import { BatchPO } from '@/lib/types/batch';

interface BatchPosHeaderProps {
  activeBatchId: string | null;
  batchList: BatchPO[];
  onBatchChange: (batchId: string) => void;
  onCreateNewBatch: (newBatchName: string) => Promise<void>;
  currentCapacity: number;
  maxCapacity: number;
  onOpenNewProductModal?: () => void;
  onRefresh?: () => void;
}

export default function BatchPosHeader({
  activeBatchId,
  batchList,
  onBatchChange,
  onCreateNewBatch,
  currentCapacity = 0,
  maxCapacity = 100,
  onOpenNewProductModal,
  onRefresh,
}: BatchPosHeaderProps) {
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchInput, setNewBatchInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const percentage = Math.min(Math.round((currentCapacity / maxCapacity) * 100), 100);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchInput.trim()) return;
    const name = newBatchInput.startsWith('#') ? newBatchInput.trim() : `#${newBatchInput.trim()}`;
    setIsSaving(true);
    await onCreateNewBatch(name);
    setIsSaving(false);
    setNewBatchInput('');
    setIsCreatingBatch(false);
  };

  return (
    <header className="bg-amber-900 text-white shadow-md sticky top-0 z-30 rounded-xl mb-4">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top Row / Left Side: Title & Action Buttons on small screens */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-700/60 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-amber-200 uppercase font-semibold tracking-wider block leading-none mb-0.5">
                Store Dashboard
              </span>
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-2 leading-tight">
                POS Batch Manager
              </h1>
            </div>
          </div>

          {/* Action buttons on mobile (so they don't get pushed to the bottom) */}
          <div className="flex md:hidden items-center gap-1.5">
            {onOpenNewProductModal && (
              <button
                onClick={onOpenNewProductModal}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Produk</span>
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-amber-800 hover:bg-amber-700 text-amber-100 p-1.5 rounded-lg transition"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Target Batch Selector & Kapasitas Widget */}
        <div className="bg-amber-800/80 px-3 py-2 rounded-xl border border-amber-700/80 flex items-center justify-between gap-3 sm:gap-4 flex-1 md:max-w-2xl min-w-0">
          {/* Batch Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Layers className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs text-amber-200 font-semibold shrink-0 hidden lg:inline">
              Target Batch:
            </span>

            {isCreatingBatch ? (
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  type="text"
                  autoFocus
                  value={newBatchInput}
                  onChange={(e) => setNewBatchInput(e.target.value)}
                  placeholder="Nama Batch Baru (mis: #BATCH-SABTU)..."
                  className="bg-white text-gray-900 font-bold text-xs px-2.5 py-1 rounded-lg focus:outline-none flex-1 min-w-[120px]"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs px-2.5 py-1 rounded-lg disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(false)}
                  className="text-amber-200 text-xs px-1.5 hover:text-white shrink-0"
                >
                  Batal
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <select
                  value={activeBatchId ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setIsCreatingBatch(true);
                    } else {
                      onBatchChange(e.target.value);
                    }
                  }}
                  className="bg-amber-900 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 min-w-[140px] truncate"
                >
                  {batchList.length === 0 && <option value="">Belum ada Batch PO</option>}
                  {batchList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__">+ Buat Batch PO Baru...</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(true)}
                  className="p-1.5 bg-amber-700/60 hover:bg-amber-600 rounded-lg text-amber-200 transition shrink-0"
                  title="Tambah Batch PO Baru"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-amber-700 shrink-0"></div>

          {/* Kapasitas Progress */}
          <div className="text-xs shrink-0 flex flex-col items-end sm:items-start min-w-[100px] sm:min-w-[120px]">
            <div className="flex items-center gap-1">
              <span className="text-amber-300 text-[11px]">Kapasitas:</span>
              <span className="font-bold text-white text-[11px]">
                {currentCapacity}/{maxCapacity} ({percentage}%)
              </span>
            </div>
            <div className="w-24 sm:w-28 bg-amber-950 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons on tablet/desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {onOpenNewProductModal && (
            <button
              onClick={onOpenNewProductModal}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3.5 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Produk Baru</span>
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-amber-800 hover:bg-amber-700 text-amber-100 p-2 rounded-lg transition shrink-0"
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
