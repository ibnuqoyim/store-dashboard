export type BusinessConfig = {
  name: string
  phone: string
  currency: string
  locale: string
  bank_name: string
  bank_account: string
  bank_holder: string
  invoice_closing_message: string
  invoice_closing_sub: string
  whatsapp_greeting_template: string
  modules_enabled: string[]
  primary_color: string
  logo_url: string
}

export const DEFAULT_CONFIG: BusinessConfig = {
  name: 'My Store',
  phone: '',
  currency: 'IDR',
  locale: 'id-ID',
  bank_name: '',
  bank_account: '',
  bank_holder: '',
  invoice_closing_message: 'Terima Kasih',
  invoice_closing_sub: '',
  whatsapp_greeting_template: '',
  modules_enabled: [],
  primary_color: '#6366f1',
  logo_url: '',
}

/**
 * Config values that can be set via environment variables.
 * These act as the middle layer in the fallback chain: DB > env vars > DEFAULT_CONFIG.
 * Useful when deploying a fresh instance before the store owner sets up store_info.
 */
export function getEnvDefaults(): Partial<BusinessConfig> {
  const result: Partial<BusinessConfig> = {}
  if (process.env.NEXT_PUBLIC_STORE_NAME)     result.name          = process.env.NEXT_PUBLIC_STORE_NAME
  if (process.env.NEXT_PUBLIC_PRIMARY_COLOR)  result.primary_color = process.env.NEXT_PUBLIC_PRIMARY_COLOR
  if (process.env.NEXT_PUBLIC_STORE_MODULES)  result.modules_enabled = process.env.NEXT_PUBLIC_STORE_MODULES.split(',').map(s => s.trim()).filter(Boolean)
  return result
}

export function formatCurrency(amount: number, config: BusinessConfig): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
  }).format(amount)
}
