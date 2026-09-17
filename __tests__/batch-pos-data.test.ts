import { describe, it, expect } from 'vitest'
import {
  mapDbOrderToBatchOrder,
  ORDER_ITEMS_SELECT,
  type DbOrderRow,
} from '@/lib/batch-pos-data'

describe('lib/batch-pos-data', () => {
  it('exports ORDER_ITEMS_SELECT query string', () => {
    expect(ORDER_ITEMS_SELECT).toBeTruthy()
    expect(ORDER_ITEMS_SELECT).toContain('order_items')
    expect(ORDER_ITEMS_SELECT).toContain('products')
  })

  describe('mapDbOrderToBatchOrder', () => {
    it('correctly maps a full db order with single product join', () => {
      const dbRow: DbOrderRow = {
        id: 'ord-123',
        invoice_number: 'INV-2026-001',
        customer_name: 'Dewi Sartika',
        phone: '08123456789',
        shipping_method: 'TIKI',
        shipping_fee: 15000,
        pay_status: 'PAID',
        pay_method: 'Transfer BCA',
        order_status: 'COMPLETED',
        created_at: '2026-09-16T10:30:00.000Z',
        order_items: [
          {
            id: 'item-1',
            product_id: 'prod-1',
            quantity: 2,
            price: 25000,
            is_custom_price: false,
            products: { name: 'Country Sourdough', price: 25000 },
          },
          {
            id: 'item-2',
            product_id: 'prod-2',
            quantity: 1,
            price: 30000,
            is_custom_price: true,
            products: { name: 'Brioche Loaf', price: 35000 },
          },
        ],
      }

      const result = mapDbOrderToBatchOrder(dbRow)

      expect(result.id).toBe('ord-123')
      expect(result.invoiceNumber).toBe('INV-2026-001')
      expect(result.customerName).toBe('Dewi Sartika')
      expect(result.phone).toBe('08123456789')
      expect(result.shipping).toBe('TIKI')
      expect(result.shippingFee).toBe(15000)
      expect(result.payStatus).toBe('PAID')
      expect(result.payMethod).toBe('Transfer BCA')
      expect(result.orderStatus).toBe('COMPLETED')
      expect(result.subtotal).toBe(80000) // (2 * 25000) + (1 * 30000) = 50000 + 30000
      expect(result.total).toBe(95000) // 80000 + 15000
      expect(result.time).toContain('WIB')
      expect(result.items.length).toBe(2)

      expect(result.items[0]).toEqual({
        productId: 'prod-1',
        name: 'Country Sourdough',
        normalPrice: 25000,
        price: 25000,
        qty: 2,
        isCustom: false,
      })

      expect(result.items[1]).toEqual({
        productId: 'prod-2',
        name: 'Brioche Loaf',
        normalPrice: 35000,
        price: 30000,
        qty: 1,
        isCustom: true,
      })
    })

    it('handles products joined as an array from PostgREST', () => {
      const dbRow: DbOrderRow = {
        id: 'ord-array',
        invoice_number: 'INV-2026-002',
        customer_name: 'Budi Handoko',
        phone: null,
        shipping_method: null,
        shipping_fee: null,
        pay_status: null,
        pay_method: null,
        order_status: null,
        created_at: '2026-09-16T12:00:00.000Z',
        order_items: [
          {
            id: 'item-arr',
            product_id: 'prod-arr',
            quantity: 3,
            price: 12000,
            is_custom_price: null,
            products: [{ name: 'Croissant Butter', price: 15000 }],
          },
        ],
      }

      const result = mapDbOrderToBatchOrder(dbRow)

      // Fallbacks
      expect(result.phone).toBe('-')
      expect(result.shipping).toBe('Ambil Sendiri')
      expect(result.shippingFee).toBe(0)
      expect(result.payStatus).toBe('UNPAID')
      expect(result.payMethod).toBe('Cash')
      expect(result.orderStatus).toBe('PENDING')

      // Item
      expect(result.items[0].name).toBe('Croissant Butter')
      expect(result.items[0].normalPrice).toBe(15000)
      expect(result.items[0].isCustom).toBe(true) // 12000 !== 15000
      expect(result.subtotal).toBe(36000)
      expect(result.total).toBe(36000)
    })

    it('handles empty products array as null product', () => {
      const dbRow: DbOrderRow = {
        id: 'ord-empty-arr',
        invoice_number: 'INV-2026-003',
        customer_name: 'Anonim',
        phone: null,
        shipping_method: null,
        shipping_fee: null,
        pay_status: null,
        pay_method: null,
        order_status: null,
        created_at: '2026-09-16T14:00:00.000Z',
        order_items: [
          {
            id: 'item-empty',
            product_id: 'prod-empty',
            quantity: 1,
            price: 10000,
            is_custom_price: null,
            products: [],
          },
        ],
      }

      const result = mapDbOrderToBatchOrder(dbRow)
      expect(result.items[0].name).toBe('Produk Dihapus')
      expect(result.items[0].normalPrice).toBe(10000)
      expect(result.items[0].isCustom).toBe(false)
    })

    it('handles deleted/null products gracefully with default name and normal price', () => {
      const dbRow: DbOrderRow = {
        id: 'ord-deleted',
        invoice_number: 'INV-2026-004',
        customer_name: 'Citra',
        phone: '08555',
        shipping_method: 'COD',
        shipping_fee: 5000,
        pay_status: 'DP',
        pay_method: 'QRIS',
        order_status: 'PENDING',
        created_at: '2026-09-16T15:00:00.000Z',
        order_items: [
          {
            id: 'item-del',
            product_id: 'prod-deleted',
            quantity: 2,
            price: 20000,
            is_custom_price: null,
            products: null,
          },
        ],
      }

      const result = mapDbOrderToBatchOrder(dbRow)
      expect(result.items[0].name).toBe('Produk Dihapus')
      expect(result.items[0].normalPrice).toBe(20000)
      expect(result.items[0].isCustom).toBe(false)
      expect(result.subtotal).toBe(40000)
      expect(result.total).toBe(45000)
    })

    it('handles order with empty or undefined order_items', () => {
      const dbRow: DbOrderRow = {
        id: 'ord-empty',
        invoice_number: 'INV-2026-005',
        customer_name: 'Kosong',
        phone: null,
        shipping_method: null,
        shipping_fee: null,
        pay_status: null,
        pay_method: null,
        order_status: null,
        created_at: '2026-09-16T16:00:00.000Z',
        order_items: undefined as unknown as DbOrderRow['order_items'],
      }

      const result = mapDbOrderToBatchOrder(dbRow)
      expect(result.items).toEqual([])
      expect(result.subtotal).toBe(0)
      expect(result.total).toBe(0)
    })
  })
})
