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

export function formatCurrency(amount: number, config: BusinessConfig): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
  }).format(amount)
}
