import { describe, it, expect } from 'vitest'
import { computeHPP, type Recipe } from '@/components/production/recipe-types'

describe('components/production/recipe-types', () => {
  describe('computeHPP', () => {
    it('computes material, labor, overhead, total, and hpp per unit accurately', () => {
      const recipe: Recipe = {
        id: 'rec-1',
        name: 'Sourdough Country Loaf',
        product_id: 'prod-1',
        yield_quantity: 10,
        yield_unit: 'loaf',
        labor_cost_per_batch: 50000,
        overhead_cost_per_batch: 20000,
        notes: '',
        products: { name: 'Country Loaf' },
        recipe_ingredients: [
          {
            id: 'ing-1',
            recipe_id: 'rec-1',
            inventory_id: 'inv-1',
            quantity: 5, // 5 kg flour
            notes: '',
            inventory: {
              id: 'inv-1',
              name: 'Bread Flour',
              unit: 'kg',
              unit_cost: 15000,
              category: 'bahan_baku',
            },
          },
          {
            id: 'ing-2',
            recipe_id: 'rec-1',
            inventory_id: 'inv-2',
            quantity: 0.1, // 100g salt
            notes: '',
            inventory: {
              id: 'inv-2',
              name: 'Sea Salt',
              unit: 'kg',
              unit_cost: 20000,
              category: 'bahan_baku',
            },
          },
        ],
      }

      // Material: (5 * 15000) + (0.1 * 20000) = 75000 + 2000 = 77000
      // Labor: 50000
      // Overhead: 20000
      // Total per batch: 147000
      // HPP per unit (yield = 10): 14700
      const result = computeHPP(recipe)
      expect(result.materialCost).toBe(77000)
      expect(result.laborCost).toBe(50000)
      expect(result.overheadCost).toBe(20000)
      expect(result.totalPerBatch).toBe(147000)
      expect(result.hppPerUnit).toBe(14700)
    })

    it('returns hppPerUnit = 0 when yield_quantity is zero or negative to prevent divide by zero', () => {
      const recipe: Recipe = {
        id: 'rec-zero',
        name: 'Zero Yield Recipe',
        product_id: null,
        yield_quantity: 0,
        yield_unit: 'pcs',
        labor_cost_per_batch: 10000,
        overhead_cost_per_batch: 5000,
        notes: '',
        products: null,
        recipe_ingredients: [],
      }

      const result = computeHPP(recipe)
      expect(result.totalPerBatch).toBe(15000)
      expect(result.hppPerUnit).toBe(0)
    })

    it('handles missing inventory details gracefully with 0 cost', () => {
      const recipe: Recipe = {
        id: 'rec-empty',
        name: 'Recipe with missing inventory link',
        product_id: null,
        yield_quantity: 5,
        yield_unit: 'pcs',
        labor_cost_per_batch: 0,
        overhead_cost_per_batch: 0,
        notes: '',
        products: null,
        recipe_ingredients: [
          {
            id: 'ing-null',
            recipe_id: 'rec-empty',
            inventory_id: 'inv-deleted',
            quantity: 2,
            notes: '',
            inventory: null,
          },
        ],
      }

      const result = computeHPP(recipe)
      expect(result.materialCost).toBe(0)
      expect(result.totalPerBatch).toBe(0)
      expect(result.hppPerUnit).toBe(0)
    })
    it('handles missing labor and overhead costs with default zero', () => {
      const recipe = {
        id: 'rec-no-labor',
        name: 'No labor recipe',
        product_id: null,
        yield_quantity: 2,
        yield_unit: 'pcs',
        labor_cost_per_batch: undefined as unknown as number,
        overhead_cost_per_batch: undefined as unknown as number,
        notes: '',
        products: null,
        recipe_ingredients: undefined as unknown as Recipe['recipe_ingredients'],
      } as Recipe

      const result = computeHPP(recipe)
      expect(result.materialCost).toBe(0)
      expect(result.laborCost).toBe(0)
      expect(result.overheadCost).toBe(0)
      expect(result.totalPerBatch).toBe(0)
      expect(result.hppPerUnit).toBe(0)
    })
    it('computes HPP with decimal quantities accurately without floating point drift', () => {
      const recipe: Recipe = {
        id: 'rec-decimal',
        name: 'Decimal Recipe',
        product_id: null,
        yield_quantity: 3,
        yield_unit: 'box',
        labor_cost_per_batch: 15000,
        overhead_cost_per_batch: 5000,
        notes: '',
        products: null,
        recipe_ingredients: [
          {
            id: 'ing-dec',
            recipe_id: 'rec-dec',
            inventory_id: 'inv-dec',
            quantity: 0.15,
            notes: '',
            inventory: {
              id: 'inv-dec',
              name: 'Butter',
              unit: 'kg',
              unit_cost: 33000,
              category: 'bahan_baku',
            },
          },
        ],
      }

      // 0.15 * 33000 = 4950
      // Total per batch: 4950 + 15000 + 5000 = 24950
      // HPP per unit (yield = 3): 24950 / 3 = 8316.666...
      const result = computeHPP(recipe)
      expect(result.materialCost).toBe(4950)
      expect(result.totalPerBatch).toBe(24950)
      expect(result.hppPerUnit).toBeCloseTo(8316.67, 2)
    })
  })
})
