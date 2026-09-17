import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'lib/config.ts',
        'lib/modules.ts',
        'lib/batch-dough-calculator.ts',
        'lib/cloudinary-image.ts',
        'lib/batch-pos-data.ts',
        'lib/widgetRegistry.ts',
        'lib/invoice-pdf.ts',
        'lib/business-config-context.tsx',
        'utils/supabase/admin.ts',
        'components/production/recipe-types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
