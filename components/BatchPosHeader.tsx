'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Store, Layers, RefreshCw, PlusCircle, Loader2, Check, ChevronsUpDown, Plus } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBatch = useMemo(
    () => batchList.find((b) => b.id === activeBatchId),
    [batchList, activeBatchId]
  );

  // Sync input with active batch name when not actively searching/opened
  useEffect(() => {
    if (!isOpen) {
      setQuery(activeBatch?.name || '');
    }
  }, [activeBatch, isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(activeBatch?.name || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeBatch]);

  const percentage = Math.min(Math.round((currentCapacity / maxCapacity) * 100), 100);

  const { filteredBatches, exactMatch, showCreateOption } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const trimmed = query.trim();
    const filtered = q ? batchList.filter((b) => b.name.toLowerCase().includes(q)) : batchList;
    const exact = trimmed
      ? batchList.find(
          (b) =>
            b.name.toLowerCase() === q ||
            b.name.toLowerCase() === `#${q}`
        )
      : null;
    return {
      filteredBatches: filtered,
      exactMatch: exact,
      showCreateOption: trimmed.length > 0 && !exact,
    };
  }, [batchList, query]);

  const handleSelectBatch = (batchId: string) => {
    onBatchChange(batchId);
    setIsOpen(false);
  };

  const handleCreateBatch = async (batchNameToCreate: string) => {
    const raw = batchNameToCreate.trim();
    if (!raw || isSaving) return;
    const formattedName = raw.startsWith('#') ? raw : `#${raw}`;
    setIsSaving(true);
    try {
      await onCreateNewBatch(formattedName);
      setQuery(formattedName);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSaving) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (exactMatch) {
        handleSelectBatch(exactMatch.id);
      } else if (filteredBatches.length > 0) {
        handleSelectBatch(filteredBatches[0].id);
      } else if (showCreateOption) {
        handleCreateBatch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery(activeBatch?.name || '');
    }
  };

  return (
    <header className="bg-amber-900 text-white shadow-md rounded-xl mb-4">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Title & Action Buttons */}
        <div className="flex items-center justify-between gap-3 shrink-0">
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

          {/* Action buttons on mobile/tablet */}
          <div className="flex lg:hidden items-center gap-1.5">
            {onOpenNewProductModal && (
              <button
                type="button"
                onClick={onOpenNewProductModal}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Produk</span>
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="bg-amber-800 hover:bg-amber-700 text-amber-100 p-1.5 rounded-lg transition"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center/Right: Target Batch Selector & Kapasitas Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 lg:justify-end min-w-0">
          <div className="bg-amber-800/80 px-3 py-2 rounded-xl border border-amber-700/80 flex items-center justify-between gap-2.5 sm:gap-3 flex-1 lg:max-w-xl min-w-0">
            {/* Batch Autocomplete Search & Create */}
            <div className="flex items-center gap-2 min-w-0 flex-1 relative" ref={dropdownRef}>
              <Layers className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-xs text-amber-200 font-semibold shrink-0 hidden sm:inline">
                Target:
              </span>

              <div className="relative flex-1 min-w-0">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-controls="batch-pos-listbox"
                    disabled={isSaving}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                      setIsOpen(true);
                      inputRef.current?.select();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik cari atau nama batch baru..."
                    className="w-full bg-amber-950/80 text-white font-bold text-xs pl-2.5 pr-7 py-1.5 rounded-lg border border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-amber-950 placeholder:text-amber-300/50 truncate disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={isSaving}
                    onClick={() => {
                      setIsOpen((prev) => !prev);
                      if (!isOpen) inputRef.current?.focus();
                    }}
                    className="absolute right-1 text-amber-300 hover:text-amber-100 p-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Autocomplete Dropdown List */}
                {isOpen && (
                  <div
                    id="batch-pos-listbox"
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white text-gray-900 rounded-xl shadow-xl border border-amber-200 py-1.5 z-50 max-h-60 overflow-y-auto"
                  >
                    {/* Option to create new batch if typed text not found */}
                    {showCreateOption && (
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        disabled={isSaving}
                        onClick={() => handleCreateBatch(query)}
                        className="w-full px-3 py-2 text-left text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center justify-between gap-2 border-b border-amber-100 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">
                            Buat Batch Baru:{' '}
                            <span className="font-bold text-amber-800">
                              {query.trim().startsWith('#') ? query.trim() : `#${query.trim()}`}
                            </span>
                          </span>
                        </div>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                          Enter
                        </span>
                      </button>
                    )}

                    {/* Filtered Existing Batches */}
                    {filteredBatches.length > 0 ? (
                      filteredBatches.map((b) => {
                        const isSelected = b.id === activeBatchId;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectBatch(b.id)}
                            className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white font-bold'
                                : 'hover:bg-amber-50 text-gray-800'
                            }`}
                          >
                            <span className="truncate">{b.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })
                    ) : !showCreateOption ? (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                        Tidak ada Batch PO yang cocok.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="h-6 w-px bg-amber-700 shrink-0"></div>

            {/* Kapasitas Progress */}
            <div className="text-xs shrink-0 flex flex-col items-end min-w-[90px] sm:min-w-[110px]">
              <div className="flex items-center gap-1">
                <span className="text-amber-300 text-[10px] sm:text-[11px]">Kapasitas:</span>
                <span className="font-bold text-white text-[10px] sm:text-[11px]">
                  {currentCapacity}/{maxCapacity} ({percentage}%)
                </span>
              </div>
              <div className="w-20 sm:w-24 bg-amber-950 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons on Desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {onOpenNewProductModal && (
              <button
                type="button"
                onClick={onOpenNewProductModal}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Produk Baru</span>
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="bg-amber-800 hover:bg-amber-700 text-amber-100 p-2 rounded-lg transition shrink-0 cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
