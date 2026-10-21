/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/** Set in the GitHub Pages preview build (see .github/workflows/deploy.yml). */
const preview = process.env.VITE_PREVIEW === 'true'

/** Keeps search engines from indexing the preview. */
const noindex: Plugin = {
  name: 'preview-noindex',
  transformIndexHtml: () =>
    preview
      ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head' }]
      : [],
}

// The final site is the root of https://air.genain3.ie/. The GitHub Pages preview is served from
// /<repo>/, so its build sets VITE_BASE. Hash routing means no server rewrite rules are needed.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), tailwindcss(), noindex],
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
})
