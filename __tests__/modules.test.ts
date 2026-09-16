import { describe, it, expect } from 'vitest'
import {
  MODULE_REGISTRY,
  MODULE_PRESETS,
  getEnabledModules,
  CATEGORY_ORDER,
} from '@/lib/modules'

describe('lib/modules', () => {
  it('contains unique module IDs in MODULE_REGISTRY', () => {
    const ids = MODULE_REGISTRY.map(m => m.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('verifies all categories in registry are known', () => {
    MODULE_REGISTRY.forEach(mod => {
      expect(CATEGORY_ORDER).toContain(mod.category)
    })
  })

  describe('MODULE_PRESETS', () => {
    it('defines bakery, retail, cafe, and service presets', () => {
      expect(MODULE_PRESETS.bakery).toBeDefined()
      expect(MODULE_PRESETS.retail).toBeDefined()
      expect(MODULE_PRESETS.cafe).toBeDefined()
      expect(MODULE_PRESETS.service).toBeDefined()
    })

    it('all preset modules exist in registry', () => {
      const validIds = new Set(MODULE_REGISTRY.map(m => m.id))
      Object.values(MODULE_PRESETS).forEach(preset => {
        preset.modules.forEach(modId => {
          expect(validIds.has(modId)).toBe(true)
        })
      })
    })
  })

  describe('getEnabledModules', () => {
    it('falls back to bakery preset if input is empty or null', () => {
      expect(getEnabledModules(null)).toEqual(MODULE_PRESETS.bakery.modules)
      expect(getEnabledModules(undefined)).toEqual(MODULE_PRESETS.bakery.modules)
      expect(getEnabledModules([])).toEqual(MODULE_PRESETS.bakery.modules)
    })

    it('filters out invalid module IDs', () => {
      const result = getEnabledModules(['orders', 'invalid-xyz', 'products'])
      expect(result).toContain('orders')
      expect(result).toContain('products')
      expect(result).not.toContain('invalid-xyz')
    })

    it('always prepends batch-pos if omitted', () => {
      const result = getEnabledModules(['orders', 'products'])
      expect(result).toContain('batch-pos')
      expect(result[0]).toBe('batch-pos')
    })
    it('keeps batch-pos position if already included', () => {
      const result = getEnabledModules(['products', 'batch-pos', 'orders'])
      expect(result).toEqual(['products', 'batch-pos', 'orders'])
    })

    it('preserves enabled modules correctly when batch-pos is already unique', () => {
      const result = getEnabledModules(['batch-pos', 'orders'])
      expect(result.filter(m => m === 'batch-pos').length).toBe(1)
    })
  })
})
