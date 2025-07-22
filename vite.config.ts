import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

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
