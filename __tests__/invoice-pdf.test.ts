import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mapBatchOrderToInvoicePdfOrder,
  generateInvoicePdf,
  type InvoicePdfOrder,
} from '@/lib/invoice-pdf'
import { DEFAULT_CONFIG, type BusinessConfig } from '@/lib/config'

// Mock jsPDF so we can test generateInvoicePdf in Node environment without a browser
const mockJsPdfInstance = {
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 210),
      getHeight: vi.fn(() => 297),
    },
  },
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  setFillColor: vi.fn(),
  rect: vi.fn(),
  saveGraphicsState: vi.fn(),
  restoreGraphicsState: vi.fn(),
  GState: class MockGState {
    constructor(public opts: { opacity: number }) {}
  },
  setGState: vi.fn(),
  addImage: vi.fn(),
  save: vi.fn(),
}

vi.mock('jspdf', () => {
  class MockJsPdf {
    constructor() {
      return mockJsPdfInstance
    }
  }
  return {
    default: MockJsPdf,
  }
})

describe('lib/invoice-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mapBatchOrderToInvoicePdfOrder', () => {
    it('correctly maps batch order to invoice PDF order shape', () => {
      const batchOrder = {
        id: 'ord-001',
        invoiceNumber: 'INV-2026-0001',
        customerName: 'Ahmad Dahlan',
        phone: '081234567890',
        date: '2026-09-16T10:00:00.000Z',
        shippingFee: 15000,
        items: [
          { name: 'Sourdough Country Loaf', price: 45000, qty: 2 },
          { name: 'Brioche Bun', price: 12000, qty: 5 },
        ],
      }

      const result = mapBatchOrderToInvoicePdfOrder(batchOrder)

      expect(result).toEqual({
        id: 'ord-001',
        invoice_number: 'INV-2026-0001',
        customer_name: 'Ahmad Dahlan',
        phone: '081234567890',
        date: '2026-09-16T10:00:00.000Z',
        shipping_fee: 15000,
        order_items: [
          { name: 'Sourdough Country Loaf', price: 45000, quantity: 2 },
          { name: 'Brioche Bun', price: 12000, quantity: 5 },
        ],
      })
    })

    it('handles nullable or optional phone, date, and shippingFee', () => {
      const batchOrder = {
        id: 'ord-minimal',
        invoiceNumber: 'INV-2026-0002',
        customerName: 'Siti Rahma',
        items: [],
      }

      const result = mapBatchOrderToInvoicePdfOrder(batchOrder)

      expect(result.id).toBe('ord-minimal')
      expect(result.invoice_number).toBe('INV-2026-0002')
      expect(result.customer_name).toBe('Siti Rahma')
      expect(result.phone).toBeUndefined()
      expect(result.date).toBeUndefined()
      expect(result.shipping_fee).toBeUndefined()
      expect(result.order_items).toEqual([])
    })
  })

  describe('generateInvoicePdf', () => {
    const mockConfig: BusinessConfig = {
      ...DEFAULT_CONFIG,
      name: 'Default Bakery',
      phone: '08111111111',
      bank_name: 'BCA',
      bank_account: '1234567890',
      bank_holder: 'Default Owner',
      invoice_closing_message: 'Terima Kasih telah berbelanja!',
      invoice_closing_sub: 'Semoga berkah selalu',
    }

    const mockOrder: InvoicePdfOrder = {
      id: 'inv-pdf-1',
      invoice_number: 'INV-001',
      customer_name: 'Dewi Sartika',
      phone: '08123456789',
      date: '2026-09-16T12:00:00.000Z',
      shipping_fee: 10000,
      order_items: [
        { name: 'Milk Bread', price: 25000, quantity: 2 },
        { name: 'Croissant', price: 18000, quantity: 1 },
      ],
    }

    it('generates PDF with store information overriding config', async () => {
      const storeOverrides = {
        name: 'Store Specific Bakery',
        phone: '08222222222',
        bank_name: 'Mandiri',
        bank_account: '987654321',
        bank_holder: 'Custom Store Owner',
        invoice_closing_message: 'Hatur nuhun!',
        invoice_closing_sub: 'Datang kembali ya',
        logo_url: null,
      }

      await generateInvoicePdf(mockOrder, mockConfig, storeOverrides)

      expect(mockJsPdfInstance.save).toHaveBeenCalledWith('Invoice-INV-001-Dewi Sartika.pdf')

      const textCalls = mockJsPdfInstance.text.mock.calls.map(call => call[0])
      expect(textCalls).toContain('Store Specific Bakery')
      expect(textCalls).toContain('08222222222')
      expect(textCalls).toContain('Hatur nuhun!')
      expect(textCalls).toContain('Datang kembali ya')
      expect(textCalls.some(t => typeof t === 'string' && t.includes('Mandiri : 987654321 a.n Custom Store Owner'))).toBe(true)
    })

    it('falls back to BusinessConfig when store info is null or empty', async () => {
      await generateInvoicePdf(mockOrder, mockConfig, null)

      expect(mockJsPdfInstance.save).toHaveBeenCalledWith('Invoice-INV-001-Dewi Sartika.pdf')

      const textCalls = mockJsPdfInstance.text.mock.calls.map(call => call[0])
      expect(textCalls).toContain('Default Bakery')
      expect(textCalls).toContain('08111111111')
      expect(textCalls).toContain('Terima Kasih telah berbelanja!')
      expect(textCalls).toContain('Semoga berkah selalu')
    })

    it('handles deliveries fallback shipping cost when shipping_fee is undefined', async () => {
      const orderWithDeliveries: InvoicePdfOrder = {
        invoice_number: 'INV-DELIVERY',
        customer_name: 'Rian',
        order_items: [{ name: 'Toast', price: 20000, quantity: 1 }],
        deliveries: [{ shipping_cost: 15000 }],
      }

      await generateInvoicePdf(orderWithDeliveries, mockConfig, null)

      expect(mockJsPdfInstance.save).toHaveBeenCalledWith('Invoice-INV-DELIVERY-Rian.pdf')
      const textCalls = mockJsPdfInstance.text.mock.calls.map(call => call[0])
      expect(textCalls).toContain('Ongkir')
      expect(textCalls).toContain('Rian')
    })

    it('handles order items with fallback name from products or default', async () => {
      const orderWithProductJoins: InvoicePdfOrder = {
        invoice_number: 'INV-JOIN',
        customer_name: 'Nadia',
        order_items: [
          { price: 15000, quantity: 1, products: { name: 'Joined Product Name' } },
          { price: 10000, quantity: 2 },
        ],
      }

      await generateInvoicePdf(orderWithProductJoins, mockConfig, null)

      const textCalls = mockJsPdfInstance.text.mock.calls.map(call => call[0])
      expect(textCalls).toContain('Joined Product Name')
      expect(textCalls).toContain('Produk')
    })

    it('omits phone when order phone is "-" or empty', async () => {
      const orderDashPhone: InvoicePdfOrder = {
        invoice_number: 'INV-NO-PHONE',
        customer_name: 'Tanpa HP',
        phone: '-',
        order_items: [{ name: 'Item A', price: 10000, quantity: 1 }],
      }

      await generateInvoicePdf(orderDashPhone, mockConfig, null)

      const textCalls = mockJsPdfInstance.text.mock.calls.map(call => call[0])
      expect(textCalls).not.toContain('-')
      expect(textCalls).toContain('Tanpa HP')
    })

    it('handles logoUrl when fetch returns not ok', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response)

      await generateInvoicePdf(mockOrder, mockConfig, {
        logo_url: 'https://res.cloudinary.com/test/image/upload/logo.png',
      })

      expect(fetchSpy).toHaveBeenCalled()
      expect(mockJsPdfInstance.addImage).not.toHaveBeenCalled()
      fetchSpy.mockRestore()
    })

    it('catches and logs watermark errors without failing the pdf generation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      await generateInvoicePdf(mockOrder, mockConfig, {
        logo_url: '/local-logo.png',
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding watermark:', expect.any(Error))
      expect(mockJsPdfInstance.save).toHaveBeenCalled()
      fetchSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('renders watermark image when DOM and image helpers are available', async () => {
      const originalFileReader = globalThis.FileReader
      const originalImage = (globalThis as unknown as { Image: unknown }).Image
      const originalDocument = (globalThis as unknown as { document: unknown }).document

      class MockFileReader {
        onloadend: (() => void) | null = null
        result = 'data:image/png;base64,raw'
        readAsDataURL() {
          this.onloadend?.()
        }
      }

      class MockImage {
        width = 200
        height = 100
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_v: string) {
          this.onload?.()
        }
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          clearRect: vi.fn(),
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,clean'),
      }

      globalThis.FileReader = MockFileReader as unknown as typeof FileReader
      ;(globalThis as unknown as { Image: unknown }).Image = MockImage
      ;(globalThis as unknown as { document: unknown }).document = {
        createElement: vi.fn(() => mockCanvas),
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['fake'])),
      } as unknown as Response)

      await generateInvoicePdf(mockOrder, mockConfig, {
        logo_url: '/store-logo.png',
      })

      expect(mockJsPdfInstance.addImage).toHaveBeenCalledWith(
        'data:image/png;base64,clean',
        'PNG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      )

      fetchSpy.mockRestore()
      globalThis.FileReader = originalFileReader
      ;(globalThis as unknown as { Image: unknown }).Image = originalImage
      ;(globalThis as unknown as { document: unknown }).document = originalDocument
    })

    it('handles tall portrait logo watermark where imgRatio <= pageRatio', async () => {
      const originalFileReader = globalThis.FileReader
      const originalImage = (globalThis as unknown as { Image: unknown }).Image
      const originalDocument = (globalThis as unknown as { document: unknown }).document

      class MockFileReader {
        onloadend: (() => void) | null = null
        result = 'data:image/png;base64,raw'
        readAsDataURL() {
          this.onloadend?.()
        }
      }

      class MockTallImage {
        width = 100
        height = 300
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_v: string) {
          this.onload?.()
        }
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          clearRect: vi.fn(),
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,clean-tall'),
      }

      globalThis.FileReader = MockFileReader as unknown as typeof FileReader
      ;(globalThis as unknown as { Image: unknown }).Image = MockTallImage
      ;(globalThis as unknown as { document: unknown }).document = {
        createElement: vi.fn(() => mockCanvas),
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['fake'])),
      } as unknown as Response)

      await generateInvoicePdf(mockOrder, mockConfig, {
        logo_url: '/store-tall-logo.png',
      })

      expect(mockJsPdfInstance.addImage).toHaveBeenCalledWith(
        'data:image/png;base64,clean-tall',
        'PNG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      )

      fetchSpy.mockRestore()
      globalThis.FileReader = originalFileReader
      ;(globalThis as unknown as { Image: unknown }).Image = originalImage
      ;(globalThis as unknown as { document: unknown }).document = originalDocument
    })

    it('re-throws when jsPDF throws an unrecoverable error', async () => {
      mockJsPdfInstance.save.mockImplementationOnce(() => {
        throw new Error('Disk full')
      })

      await expect(generateInvoicePdf(mockOrder, mockConfig, null)).rejects.toThrow('Disk full')
    })
  })
})
