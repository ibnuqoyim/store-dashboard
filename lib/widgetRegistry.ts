export type WidgetId = 'stat-cards' | 'orders-table' | 'product-summary' | 'adonan-summary'

export type WidgetConfig = {
    id: WidgetId
    enabled: boolean
}

export type WidgetMeta = {
    id: WidgetId
    label: string
    description: string
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
    { id: 'stat-cards',      label: 'Stat Cards',      description: 'Total orders, revenue, dan pending invoices' },
    { id: 'orders-table',    label: 'Tabel Orders',    description: 'Daftar order dengan filter dan aksi invoice' },
    { id: 'product-summary', label: 'Product Summary', description: 'Ringkasan penjualan per produk' },
    { id: 'adonan-summary',  label: 'Adonan Summary',  description: 'Kalkulasi batch dan berat adonan' },
]

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = WIDGET_REGISTRY.map(w => ({
    id: w.id,
    enabled: true,
}))

export const WIDGET_STORAGE_KEY = 'dashboard_widget_config'
