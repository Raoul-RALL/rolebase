import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Vitest 4+ no longer excludes build output by default
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
})
