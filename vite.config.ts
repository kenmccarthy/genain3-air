/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Built for the root of its own site (https://air.genain3.ie/). Hash routing means no server
// rewrite rules are needed.
export default defineConfig({
  base: '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), tailwindcss()],
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
})
