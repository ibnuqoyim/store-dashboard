import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONFIG, getEnvDefaults, formatCurrency, type BusinessConfig } from '@/lib/config'

describe('lib/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('DEFAULT_CONFIG', () => {
    it('has standard fallback configuration', () => {
      expect(DEFAULT_CONFIG.name).toBe('My Store')
      expect(DEFAULT_CONFIG.currency).toBe('IDR')
      expect(DEFAULT_CONFIG.locale).toBe('id-ID')
      expect(DEFAULT_CONFIG.primary_color).toBe('#6366f1')
      expect(DEFAULT_CONFIG.invoice_closing_message).toBe('Terima Kasih')
      expect(DEFAULT_CONFIG.modules_enabled).toEqual([])
    })
  })

  describe('getEnvDefaults', () => {
    it('returns empty object when no custom env vars are set', () => {
      delete process.env.NEXT_PUBLIC_STORE_NAME
      delete process.env.NEXT_PUBLIC_PRIMARY_COLOR
      delete process.env.NEXT_PUBLIC_STORE_MODULES

      const defaults = getEnvDefaults()
      expect(defaults).toEqual({})
    })

    it('reads store name, primary color, and comma-separated modules from env', () => {
      process.env.NEXT_PUBLIC_STORE_NAME = 'Bakery Kita'
      process.env.NEXT_PUBLIC_PRIMARY_COLOR = '#10b981'
      process.env.NEXT_PUBLIC_STORE_MODULES = 'pos, orders, inventory'

      const defaults = getEnvDefaults()
      expect(defaults.name).toBe('Bakery Kita')
      expect(defaults.primary_color).toBe('#10b981')
      expect(defaults.modules_enabled).toEqual(['pos', 'orders', 'inventory'])
    })
  })

  describe('formatCurrency', () => {
    it('formats IDR currency accurately without decimals by default', () => {
      const config: BusinessConfig = {
        ...DEFAULT_CONFIG,
        currency: 'IDR',
        locale: 'id-ID',
      }
      const formatted = formatCurrency(50000, config)
      // Normalize non-breaking spaces and verify exact match
      expect(formatted.replace(/\s+/g, ' ').trim()).toMatch(/^Rp\s*50\.000$/)
    })

    it('formats IDR zero amount properly', () => {
      const config: BusinessConfig = {
        ...DEFAULT_CONFIG,
        currency: 'IDR',
        locale: 'id-ID',
      }
      const formatted = formatCurrency(0, config)
      expect(formatted.replace(/\s+/g, ' ').trim()).toMatch(/^Rp\s*0$/)
    })

    it('formats USD currency robustly with en-US locale', () => {
      const config: BusinessConfig = {
        ...DEFAULT_CONFIG,
        currency: 'USD',
        locale: 'en-US',
      }
      const formatted = formatCurrency(1250, config)
      expect(formatted.replace(/\s+/g, ' ')).toMatch(/(?:US)?\$\s*1,250/)
    })

    it('handles negative financial amounts accurately', () => {
      const config: BusinessConfig = {
        ...DEFAULT_CONFIG,
        currency: 'IDR',
        locale: 'id-ID',
      }
      const formatted = formatCurrency(-25000, config)
      expect(formatted.replace(/\s+/g, ' ')).toMatch(/-Rp\s*25\.000/)
    })
  })
})
