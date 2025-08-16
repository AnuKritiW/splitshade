import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Patch __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  base: '/splitshade/',
  build: {
    outDir: 'dist',
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),        // maps @/ to /src
      '@tests': path.resolve(__dirname, 'tests')  // maps @tests to /tests
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: './test/setup.ts'
  }
})
