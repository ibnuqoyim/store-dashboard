'use client'

import React from 'react'
import { Filter, Search } from 'lucide-react'
import type { CostFilter } from './types'

interface InventoryFilterToolbarProps {
    searchTerm: string
    setSearchTerm: (value: string) => void
    categoryFilter: string
    setCategoryFilter: (value: string) => void
    stockFilter: string
    setStockFilter: (value: string) => void
    itemsPerPage: number
    setItemsPerPage: (value: number) => void
    costFilter: CostFilter
    setCostFilter: React.Dispatch<React.SetStateAction<CostFilter>>
    setCurrentPage: (page: number) => void
    paginatedCount: number
    totalCount: number
}

export default function InventoryFilterToolbar({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    itemsPerPage,
    setItemsPerPage,
    costFilter,
    setCostFilter,
    setCurrentPage,
    paginatedCount,
    totalCount,
}: InventoryFilterToolbarProps) {
    const handleClearFilters = () => {
        setSearchTerm('')
        setCategoryFilter('all')
        setStockFilter('all')
        setCostFilter({ min: '', max: '' })
        setCurrentPage(1)
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-3">
                <Filter size={18} className="text-gray-500" />
                <h3 className="font-medium text-gray-700">Search & Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Item name, supplier..."
                            className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="bahan_baku">Bahan Baku</option>
                        <option value="packaging">Packaging</option>
                    </select>
                </div>

                {/* Stock Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                    <select
                        className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                    >
                        <option value="all">All Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="normal">Normal Stock</option>
                    </select>
                </div>

                {/* Items per page */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                    <select
                        className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Cost Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Unit Cost</label>
                    <input
                        type="number"
                        placeholder="Min unit cost"
                        className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                        value={costFilter.min}
                        onChange={(e) => setCostFilter(prev => ({ ...prev, min: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Unit Cost</label>
                    <input
                        type="number"
                        placeholder="Max unit cost"
                        className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm text-gray-900"
                        value={costFilter.max}
                        onChange={(e) => setCostFilter(prev => ({ ...prev, max: e.target.value }))}
                    />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Showing {paginatedCount} of {totalCount} items
                </div>
                <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                    Clear all filters
                </button>
            </div>
        </div>
    )
}
