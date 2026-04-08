'use client'

import { useState } from 'react'
import ProfitLossReport from './ProfitLossReport'
import FinancialReport from './FinancialReport'

const TABS = [
    { id: 'pl', label: 'Laba / Rugi' },
    { id: 'transactions', label: 'Transaksi' },
] as const

type Tab = typeof TABS[number]['id']

export default function FinancialTabs() {
    const [active, setActive] = useState<Tab>('pl')

    return (
        <div>
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-1" aria-label="Financial tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                                active === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {active === 'pl' ? <ProfitLossReport /> : <FinancialReport />}
        </div>
    )
}
