import { describe, it, expect } from 'vitest'
import { WIDGET_REGISTRY, DEFAULT_WIDGET_CONFIG, type WidgetId } from '@/lib/widgetRegistry'

describe('lib/widgetRegistry', () => {
  const expectedWidgetIds: WidgetId[] = [
    'stat-cards',
    'orders-table',
    'product-summary',
    'adonan-summary',
  ]

  it('contains the expected predefined widget list', () => {
    const ids = WIDGET_REGISTRY.map(w => w.id)
    expect(ids).toEqual(expectedWidgetIds)
  })

  it('ensures each widget metadata has non-empty label and description', () => {
    WIDGET_REGISTRY.forEach(widget => {
      expect(widget.id).toBeTruthy()
      expect(widget.label.trim().length).toBeGreaterThan(0)
      expect(widget.description.trim().length).toBeGreaterThan(0)
    })
  })

  it('ensures all widget IDs are unique', () => {
    const ids = WIDGET_REGISTRY.map(w => w.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(WIDGET_REGISTRY.length)
  })

  describe('DEFAULT_WIDGET_CONFIG', () => {
    it('enables all registered widgets by default', () => {
      expect(DEFAULT_WIDGET_CONFIG.length).toBe(WIDGET_REGISTRY.length)
      DEFAULT_WIDGET_CONFIG.forEach(cfg => {
        expect(cfg.enabled).toBe(true)
        expect(expectedWidgetIds).toContain(cfg.id)
      })
    })
  })
})
