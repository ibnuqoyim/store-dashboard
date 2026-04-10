export type ModuleId =
  | 'orders'
  | 'products'
  | 'customers'
  | 'adonan'
  | 'batch-po'
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
  { id: 'adonan',       label: 'Adonan',      href: '/adonan',      category: 'Production' },
  { id: 'batch-po',     label: 'Pre-Orders',  href: '/batch-po',    category: 'Production' },
  { id: 'inventory',    label: 'Inventory',   href: '/inventory',   category: 'Production' },
  { id: 'resep',        label: 'Resep & HPP', href: '/resep',       category: 'Production' },
  { id: 'produksi',     label: 'Produksi',    href: '/produksi',    category: 'Production' },
  { id: 'orders',       label: 'Orders',      href: '/orders',      category: 'Sales & Orders' },
  { id: 'deliveries',   label: 'Deliveries',  href: '/deliveries',  category: 'Sales & Orders' },
  { id: 'shipping',     label: 'Shipping',    href: '/shipping',    category: 'Sales & Orders' },
  { id: 'financial',    label: 'Financial',   href: '/financial',   category: 'Financial' },
  { id: 'expenses',     label: 'Expenses',    href: '/expenses',    category: 'Financial' },
  { id: 'testimonials', label: 'Testimonials',href: '/testimonials',category: 'Settings' },
]

export const MODULE_PRESETS: Record<ModulePreset, { label: string; modules: ModuleId[] }> = {
  bakery: {
    label: 'Bakery / Roti',
    modules: ['orders', 'products', 'customers', 'adonan', 'batch-po', 'inventory', 'resep', 'produksi', 'deliveries', 'shipping', 'financial', 'expenses', 'testimonials'],
  },
  retail: {
    label: 'Retail / Toko',
    modules: ['orders', 'products', 'customers', 'inventory', 'deliveries', 'shipping', 'financial', 'expenses'],
  },
  cafe: {
    label: 'Cafe / Kuliner',
    modules: ['orders', 'products', 'customers', 'inventory', 'financial', 'expenses', 'testimonials'],
  },
  service: {
    label: 'Jasa / Service',
    modules: ['orders', 'customers', 'financial', 'expenses'],
  },
}

const VALID_IDS = new Set<string>(MODULE_REGISTRY.map(m => m.id))

export function getEnabledModules(modules: string[] | null | undefined): ModuleId[] {
  if (!modules || modules.length === 0) {
    return MODULE_PRESETS.bakery.modules
  }
  return modules.filter((id): id is ModuleId => VALID_IDS.has(id))
}

export const CATEGORY_ORDER = ['Main', 'Production', 'Sales & Orders', 'Financial', 'Settings']
