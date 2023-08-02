/// <reference types="vitest" />

import { defineConfig } from 'vite'

process.env = { ...process.env, CI: 'true', TESTING: 'true' }

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'json'],
      exclude: ['dist/**', 'tests/**']
    }
  }
})