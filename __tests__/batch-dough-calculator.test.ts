import { describe, it, expect } from 'vitest'
import {
  BatchDoughCalculatorService,
  type OrderCreatePayload,
} from '@/lib/batch-dough-calculator'

describe('lib/batch-dough-calculator', () => {
  it('handles empty orders gracefully with zero requirements', () => {
    const result = BatchDoughCalculatorService.calculateBatchRequirements([])
    expect(result.totalWeightKg).toBe(0)
    expect(result.ingredients.flourKg).toBe(0)
    expect(result.ingredients.waterLiter).toBe(0)
    expect(result.ingredients.levainActiveKg).toBe(0)
    expect(result.ingredients.saltGrams).toBe(0)
    expect(result.fillings.creamCheeseKg).toBe(0)
    expect(result.fillings.chocoChipsKg).toBe(0)
  })

  it('calculates requirements accurately for single Milk Bread order', () => {
    const orders: OrderCreatePayload[] = [
      {
        batchId: 'batch-1',
        customerName: 'Budi',
        shippingMethod: 'Ahsan',
        shippingFee: 10000,
        payStatus: 'PAID',
        payMethod: 'QRIS',
        items: [
          {
            productId: 'prod-1',
            productName: 'Milk Bread',
            qty: 10,
            unitPrice: 25000,
          },
        ],
      },
    ]

    // 10 units of Milk Bread:
    // flour: 120g * 10 = 1200g = 1.2kg
    // water: 1200 * 0.65 = 780g = 0.78L
    // levain: 1200 * 0.20 = 240g = 0.24kg
    // salt: 1200 * 0.02 = 24g
    // base weight: 1.2 + 0.78 + 0.24 = 2.22kg
    const result = BatchDoughCalculatorService.calculateBatchRequirements(orders)
    expect(result.ingredients.flourKg).toBe(1.2)
    expect(result.ingredients.waterLiter).toBe(0.78)
    expect(result.ingredients.levainActiveKg).toBe(0.24)
    expect(result.ingredients.saltGrams).toBe(24)
    expect(result.totalWeightKg).toBe(2.22)
  })

  it('aggregates fillings for Earl Grey CC Mini and Chocobanana', () => {
    const orders: OrderCreatePayload[] = [
      {
        batchId: 'batch-1',
        customerName: 'Siti',
        shippingMethod: 'Ambil Sendiri',
        shippingFee: 0,
        payStatus: 'PAID',
        payMethod: 'Transfer BCA',
        items: [
          {
            productId: 'prod-eg',
            productName: 'Earl Grey CC Mini',
            qty: 5,
            unitPrice: 15000,
          },
          {
            productId: 'prod-cb',
            productName: 'Chocobanana',
            qty: 4,
            unitPrice: 18000,
          },
        ],
      },
    ]

    // Earl Grey CC Mini: 30g creamCheese * 5 = 150g = 0.15kg
    // Chocobanana: 25g chocoChips * 4 = 100g = 0.1kg
    const result = BatchDoughCalculatorService.calculateBatchRequirements(orders)
    expect(result.fillings.creamCheeseKg).toBe(0.15)
    expect(result.fillings.chocoChipsKg).toBe(0.1)
  })

  it('falls back to default recipe ratio for unmapped product names', () => {
    const orders: OrderCreatePayload[] = [
      {
        batchId: 'batch-1',
        customerName: 'Agus',
        shippingMethod: 'COD',
        shippingFee: 5000,
        payStatus: 'PAID',
        payMethod: 'Cash',
        items: [
          {
            productId: 'prod-unknown',
            productName: 'Roti Spesial Custom',
            qty: 2,
            unitPrice: 30000,
          },
        ],
      },
    ]

    // Default: 100g flour * 2 = 200g = 0.2kg
    const result = BatchDoughCalculatorService.calculateBatchRequirements(orders)
    expect(result.ingredients.flourKg).toBe(0.2)
  })

  it('supports dynamic recipe ratio overrides via customRecipeMap', () => {
    const orders: OrderCreatePayload[] = [
      {
        batchId: 'batch-custom',
        customerName: 'Dewi',
        shippingMethod: 'COD',
        shippingFee: 0,
        payStatus: 'PAID',
        payMethod: 'Cash',
        items: [
          {
            productId: 'prod-mb',
            productName: 'Milk Bread',
            qty: 10,
            unitPrice: 25000,
          },
        ],
      },
    ]

    // Override Milk Bread flour to 150g and water to 0.60
    const customRecipeMap = {
      'Milk Bread': {
        flourPerUnitGrams: 150,
        waterRatio: 0.60,
      },
    }

    // 10 * 150g = 1500g = 1.5kg flour
    // water: 1500 * 0.60 = 900g = 0.9L
    const result = BatchDoughCalculatorService.calculateBatchRequirements(orders, customRecipeMap)
    expect(result.ingredients.flourKg).toBe(1.5)
    expect(result.ingredients.waterLiter).toBe(0.9)
  })

  it('supports injecting new recipes for unmapped products and instance-based calculate', () => {
    const orders: OrderCreatePayload[] = [
      {
        batchId: 'batch-instance',
        customerName: 'Rian',
        shippingMethod: 'COD',
        shippingFee: 0,
        payStatus: 'PAID',
        payMethod: 'Cash',
        items: [
          {
            productId: 'prod-brioche',
            productName: 'Brioche Bun',
            qty: 5,
            unitPrice: 35000,
          },
        ],
      },
    ]

    const customMap = {
      'Brioche Bun': {
        flourPerUnitGrams: 200,
        waterRatio: 0.5,
        levainRatio: 0.1,
        saltRatio: 0.02,
      },
    }

    const service = new BatchDoughCalculatorService(customMap)
    const result = service.calculate(orders)

    // 5 * 200g = 1000g = 1kg flour
    // water: 1000 * 0.5 = 500g = 0.5L
    // levain: 1000 * 0.1 = 100g = 0.1kg
    // salt: 1000 * 0.02 = 20g
    expect(result.ingredients.flourKg).toBe(1.0)
    expect(result.ingredients.waterLiter).toBe(0.5)
    expect(result.ingredients.levainActiveKg).toBe(0.1)
    expect(result.ingredients.saltGrams).toBe(20)
    expect(result.totalWeightKg).toBe(1.6)
  })
})
