/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'

import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url' // NOU: Importul funcțiilor URL

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      // NOU: Alias configurat folosind fileURLToPath și URL (standard Vite)
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})