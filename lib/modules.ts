export type ModuleId =
  | 'orders'
  | 'products'
  | 'customers'
  | 'adonan'
  | 'batch-po'
  | 'batch-pos'
  | 'inventory'
  | 'resep'
  | 'produksi'
  | 'deliveries'
  | 'shipping'
  | 'financial'
  | 'expenses'
  | 'testimonials'

export type ModulePreset = 'bakery' | 'retail' | 'cafe' | 'service'

export type ModuleDef = {
  id: ModuleId
  label: string
  href: string
  category: string
}

export const MODULE_REGISTRY: ModuleDef[] = [
  { id: 'customers',    label: 'Customers',   href: '/customers',   category: 'Main' },
  { id: 'products',     label: 'Products',    href: '/products',    category: 'Main' },
  { id: 'batch-pos',    label: 'Batch POS',   href: '/batch-pos',   category: 'Sales & Orders' },
  { id: 'orders',       label: 'Orders',      href: '/orders',      category: 'Sales & Orders' },
  { id: 'adonan',       label: 'Adonan',      href: '/adonan',      category: 'Production' },
  { id: 'batch-po',     label: 'Pre-Orders',  href: '/batch-po',    category: 'Production' },
  { id: 'inventory',    label: 'Inventory',   href: '/inventory',   category: 'Production' },
  { id: 'resep',        label: 'Resep & HPP', href: '/resep',       category: 'Production' },
  { id: 'produksi',     label: 'Produksi',    href: '/produksi',    category: 'Production' },
  { id: 'deliveries',   label: 'Deliveries',  href: '/deliveries',  category: 'Sales & Orders' },
  { id: 'shipping',     label: 'Shipping',    href: '/shipping',    category: 'Sales & Orders' },
  { id: 'financial',    label: 'Financial',   href: '/financial',   category: 'Financial' },
  { id: 'expenses',     label: 'Expenses',    href: '/expenses',    category: 'Financial' },
  { id: 'testimonials', label: 'Testimonials',href: '/testimonials',category: 'Settings' },
]

export const MODULE_PRESETS: Record<ModulePreset, { label: string; modules: ModuleId[] }> = {
  bakery: {
    label: 'Bakery / Roti',
    modules: ['batch-pos', 'orders', 'products', 'customers', 'adonan', 'batch-po', 'inventory', 'resep', 'produksi', 'deliveries', 'shipping', 'financial', 'expenses', 'testimonials'],
  },
  retail: {
    label: 'Retail / Toko',
    modules: ['batch-pos', 'orders', 'products', 'customers', 'inventory', 'deliveries', 'shipping', 'financial', 'expenses'],
  },
  cafe: {
    label: 'Cafe / Kuliner',
    modules: ['batch-pos', 'orders', 'products', 'customers', 'inventory', 'financial', 'expenses', 'testimonials'],
  },
  service: {
    label: 'Jasa / Service',
    modules: ['batch-pos', 'orders', 'customers', 'financial', 'expenses'],
  },
}

const VALID_IDS = new Set<string>(MODULE_REGISTRY.map(m => m.id))

export function getEnabledModules(modules: string[] | null | undefined): ModuleId[] {
  if (!modules || modules.length === 0) {
    return MODULE_PRESETS.bakery.modules
  }
  const enabled = modules.filter((id): id is ModuleId => VALID_IDS.has(id))
  // Always include batch-pos if not explicitly present in existing store_info array
  if (!enabled.includes('batch-pos')) {
    enabled.unshift('batch-pos')
  }
  return enabled
}

export const CATEGORY_ORDER = ['Main', 'Production', 'Sales & Orders', 'Financial', 'Settings']
