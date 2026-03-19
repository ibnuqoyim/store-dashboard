'use client'

import { X, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { WIDGET_REGISTRY, DEFAULT_WIDGET_CONFIG, WidgetConfig } from '@/lib/widgetRegistry'

type Props = {
    isOpen: boolean
    onClose: () => void
    config: WidgetConfig[]
    onChange: (newConfig: WidgetConfig[]) => void
}

export default function DashboardCustomizer({ isOpen, onClose, config, onChange }: Props) {
    const move = (index: number, direction: -1 | 1) => {
        const next = [...config]
        const swapIndex = index + direction
        ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
        onChange(next)
    }

    const toggle = (index: number) => {
        onChange(config.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item))
    }

    const reset = () => onChange(DEFAULT_WIDGET_CONFIG)

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={clsx(
                    'fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50',
                    'flex flex-col transform transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Kustomisasi Dashboard</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Atur widget dan urutannya</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Widget List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {config.map((widget, index) => {
                        const meta = WIDGET_REGISTRY.find(w => w.id === widget.id)
                        if (!meta) return null
                        return (
                            <div
                                key={widget.id}
                                className={clsx(
                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                    widget.enabled ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'
                                )}
                            >
                                {/* Up/Down */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        className="p-0.5 hover:bg-white rounded disabled:opacity-25 disabled:cursor-not-allowed text-gray-500"
                                    >
                                        <ChevronUp size={15} />
                                    </button>
                                    <button
                                        onClick={() => move(index, 1)}
                                        disabled={index === config.length - 1}
                                        className="p-0.5 hover:bg-white rounded disabled:opacity-25 disabled:cursor-not-allowed text-gray-500"
                                    >
                                        <ChevronDown size={15} />
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={clsx('text-sm font-medium', widget.enabled ? 'text-gray-900' : 'text-gray-400')}>
                                        {meta.label}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{meta.description}</p>
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => toggle(index)}
                                    role="switch"
                                    aria-checked={widget.enabled}
                                    className={clsx(
                                        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent',
                                        'transition-colors duration-200 focus:outline-none',
                                        widget.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            'inline-block h-4 w-4 transform rounded-full bg-white shadow',
                                            'transition-transform duration-200',
                                            widget.enabled ? 'translate-x-4' : 'translate-x-0'
                                        )}
                                    />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t">
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto"
                    >
                        <RotateCcw size={13} />
                        Reset ke default
                    </button>
                </div>
            </div>
        </>
    )
}
