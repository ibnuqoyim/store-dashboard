import { test, expect, type Page } from '@playwright/test'

const mockHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
const mockPayload = Buffer.from(JSON.stringify({
  sub: '11111111-1111-1111-1111-111111111111',
  email: 'owner@sourdoughmu.com',
  role: 'authenticated',
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600 * 24,
})).toString('base64url')
const MOCK_JWT = `${mockHeader}.${mockPayload}.signature`

async function loginAsStoreOwner(page: Page) {
  await page.route('**/auth/v1/token**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: MOCK_JWT,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@sourdoughmu.com',
        },
      }),
    })
  })

  await page.goto('/login')
  await page.locator('input[type="email"]').fill('owner@sourdoughmu.com')
  await page.locator('input[type="password"]').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 10000 })
}

test.describe('Batch POS & Checkout User Journey', () => {
  test('authenticates store owner and lands on dashboard with navigation sidebar', async ({ page }) => {
    await loginAsStoreOwner(page)

    // Verify authenticated view contains store branding and sidebar
    await expect(page.getByText('Sourdoughmu_ya Bakery')).toBeVisible()
    await expect(page.getByRole('link', { name: /batch pos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /orders/i })).toBeVisible()
  })

  test('displays product catalog and filters products via search', async ({ page }) => {
    await loginAsStoreOwner(page)
    await page.goto('/batch-pos')

    // Verify POS Batch Manager header and active batch in combobox
    await expect(page.getByRole('heading', { name: /POS Batch Manager/i })).toBeVisible()
    await expect(page.getByPlaceholder('Ketik cari atau nama batch baru...')).toHaveValue('Batch Pagi 16 Sept')

    // Verify catalog items are present
    const sourdoughCard = page.locator('h4', { hasText: 'Sourdough Country Loaf' })
    const milkBreadCard = page.locator('h4', { hasText: 'Milk Bread Toast' })
    const croissantCard = page.locator('h4', { hasText: 'Butter Croissant' })

    await expect(sourdoughCard).toBeVisible()
    await expect(milkBreadCard).toBeVisible()
    await expect(croissantCard).toBeVisible()

    // Test product search filter
    const searchInput = page.getByPlaceholder('Cari produk...')
    await searchInput.fill('Toast')

    await expect(milkBreadCard).toBeVisible()
    await expect(sourdoughCard).not.toBeVisible()
    await expect(croissantCard).not.toBeVisible()

    // Clear search filter
    await searchInput.fill('')
    await expect(sourdoughCard).toBeVisible()
    await expect(croissantCard).toBeVisible()
  })

  test('manages cart items, updates quantities, and calculates shipping and grand total', async ({ page }) => {
    await loginAsStoreOwner(page)
    await page.goto('/batch-pos')

    // Initial cart should be empty
    await expect(page.getByText(/keranjang kosong/i)).toBeVisible()

    // Add Sourdough Country Loaf to cart
    await page.locator('h4', { hasText: 'Sourdough Country Loaf' }).click()

    // Cart should now contain Sourdough item
    const cartSourdoughItem = page.locator('span.font-bold.text-gray-800', { hasText: 'Sourdough Country Loaf' })
    await expect(cartSourdoughItem).toBeVisible()
    await expect(page.getByText('Subtotal Produk:').locator('..').getByText('Rp 45.000')).toBeVisible()

    // Increment quantity via "+" button inside cart
    await page.locator('div.border.rounded.overflow-hidden button:has-text("+")').click()
    await expect(page.getByText('Subtotal Produk:').locator('..').getByText('Rp 90.000')).toBeVisible()

    // Add Butter Croissant to cart
    await page.locator('h4', { hasText: 'Butter Croissant' }).click()
    const cartCroissantItem = page.locator('span.font-bold.text-gray-800', { hasText: 'Butter Croissant' })
    await expect(cartCroissantItem).toBeVisible()

    // Subtotal should be Rp 108.000 (90.000 + 18.000)
    await expect(page.getByText('Subtotal Produk:').locator('..').getByText('Rp 108.000')).toBeVisible()

    // Test shipping fee update: set to 0
    const shippingFeeInput = page.locator('input[placeholder="0"]')
    await shippingFeeInput.fill('0')
    await expect(page.getByText('Total Tagihan:').locator('..').getByText('Rp 108.000')).toBeVisible()

    // Test shipping fee update: set to 15000 (Grand Total = 108.000 + 15.000 = 123.000)
    await shippingFeeInput.fill('15000')
    await expect(page.getByText('Total Tagihan:').locator('..').getByText('Rp 123.000')).toBeVisible()

    // Test Clear Cart button
    await page.getByRole('button', { name: /clear/i }).click()
    await expect(page.getByText(/keranjang kosong/i)).toBeVisible()
  })

  test('submits order successfully and triggers success confirmation', async ({ page }) => {
    await loginAsStoreOwner(page)
    await page.goto('/batch-pos')

    // Fill customer data
    const nameInput = page.getByPlaceholder('Ketik nama (autocomplete)...')
    await nameInput.fill('Dewi Sartika')

    const phoneInput = page.getByPlaceholder('087722732214')
    await phoneInput.fill('081234567890')

    // Add item to cart
    await page.locator('h4', { hasText: 'Sourdough Country Loaf' }).click()

    // Expect confirmation alert on order submit using once listener before clicking
    let dialogAppeared = false
    page.once('dialog', async dialog => {
      dialogAppeared = true
      expect(dialog.message()).toMatch(/berhasil/i)
      await dialog.accept()
    })

    // Submit order
    const submitButton = page.getByRole('button', { name: /simpan order/i })
    await submitButton.click()

    // Assert order placement completed
    await expect.poll(() => dialogAppeared, { timeout: 10000 }).toBe(true)
  })
})
