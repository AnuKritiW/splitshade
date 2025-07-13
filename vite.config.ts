import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/splitshade/',
  build: {
    outDir: 'dist',
  },
  plugins: [vue()],
})
