import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import {
  BusinessConfigProvider,
  useBusinessConfig,
} from '@/lib/business-config-context'
import { DEFAULT_CONFIG, type BusinessConfig } from '@/lib/config'

describe('lib/business-config-context', () => {
  function TestConsumer() {
    const config = useBusinessConfig()
    return (
      <div>
        <span data-testid="store-name">{config.name}</span>
        <span data-testid="currency">{config.currency}</span>
        <span data-testid="primary-color">{config.primary_color}</span>
        <span data-testid="closing-msg">{config.invoice_closing_message}</span>
      </div>
    )
  }

  it('provides default config when used outside of provider', () => {
    const html = renderToStaticMarkup(<TestConsumer />)

    expect(html).toContain(DEFAULT_CONFIG.name)
    expect(html).toContain(DEFAULT_CONFIG.currency)
    expect(html).toContain(DEFAULT_CONFIG.primary_color)
    expect(html).toContain(DEFAULT_CONFIG.invoice_closing_message)
  })

  it('provides custom business config when wrapped inside BusinessConfigProvider', () => {
    const customConfig: BusinessConfig = {
      ...DEFAULT_CONFIG,
      name: 'Artisan Bakery Bali',
      currency: 'USD',
      primary_color: '#059669',
    }

    const html = renderToStaticMarkup(
      <BusinessConfigProvider config={customConfig}>
        <TestConsumer />
      </BusinessConfigProvider>
    )

    expect(html).toContain('Artisan Bakery Bali')
    expect(html).toContain('USD')
    expect(html).toContain('#059669')
    expect(html).toContain(DEFAULT_CONFIG.invoice_closing_message)
  })
})
