import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
    auth: options?.auth,
  })),
}))

describe('utils/supabase/admin', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws an error if SUPABASE_SERVICE_ROLE_KEY is undefined or empty', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    expect(() => createAdminClient()).toThrow(
      'SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables'
    )
  })

  it('creates and returns admin Supabase client with non-persisted session options when service role key is provided', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret-service-role-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom-project.supabase.co'

    const client = createAdminClient()

    expect(createClient).toHaveBeenCalledWith(
      'https://custom-project.supabase.co',
      'secret-service-role-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    expect(client).toBeDefined()
  })
})
