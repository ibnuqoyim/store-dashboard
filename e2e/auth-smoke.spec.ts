import { test, expect } from '@playwright/test'

test.describe('Auth & Route Protection Smoke Tests', () => {
  test('redirects unauthenticated user from root (/) to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects unauthenticated user from protected routes to /login', async ({ page }) => {
    const protectedRoutes = ['/orders', '/inventory', '/financial', '/resep', '/stores']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('renders login page correctly with branding and input fields', async ({ page }) => {
    await page.goto('/login')

    // Branding & Header
    await expect(page.getByRole('img', { name: /sourdoughmu_ya logo/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: /sourdoughmu_ya/i })).toBeVisible()
    await expect(page.getByText(/sign in to manage your orders/i)).toBeVisible()

    // Form inputs
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const signInButton = page.getByRole('button', { name: /sign in/i })
    const googleButton = page.getByRole('button', { name: /google/i })

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(signInButton).toBeVisible()
    await expect(googleButton).toBeVisible()

    // Inputs should be required
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('shows error message when login with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Mock Supabase signInWithPassword endpoint to return invalid credentials error
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          message: 'Invalid login credentials',
          msg: 'Invalid login credentials',
        }),
      })
    })

    await page.locator('input[type="email"]').fill('wronguser@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Error banner should appear
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible()
  })
})
