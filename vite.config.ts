/// <reference types="vitest" />

import { defineConfig } from 'vite'

process.env = { ...process.env, CI: 'true', TESTING: 'true' }

export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['lcov'],
      exclude: ['dist/**', 'tests/**']
    }
  }
})