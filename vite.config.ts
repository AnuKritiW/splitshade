import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

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
      '@': path.resolve(__dirname, 'src') // maps @/ to /src
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: './test/setup.ts'
  }
})
