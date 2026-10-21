import { describe, expect, it } from 'vitest'
import {
  APP_VERSION,
  BRANDING,
  IS_PREVIEW,
  feedbackMailto,
  versionLabel,
} from '../src/config/branding'
import { SCHEMA_VERSION_V2 } from '../src/model/v2/schema'

const sources = import.meta.glob('../src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Root files, read through Vite so the tests need no Node type definitions.
const root = import.meta.glob(
  [
    '../index.html',
    '../package.json',
    '../README.md',
    '../LICENSE',
    '../CONTENT-LICENSE.md',
    '../BRANDING.md',
    '../THIRD-PARTY-NOTICES.md',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
const readRoot = (f: string) => root[`../${f}`]

/** Files that may name SETU: provenance and migration, and the About/Help history notes. */
const MAY_NAME_SETU = [
  '../src/config/branding.ts',
  '../src/content/about.ts',
  '../src/content/help.ts',
  '../src/store/library.ts',
  '../src/model/v2/schema.ts',
  '../src/store/provenance.ts',
  '../src/store/importV2.ts',
  '../src/store/unknownFields.ts',
  '../src/features/review/ProvenanceDialog.tsx',
  '../src/features/home/ImportButton.tsx',
]

describe('identity', () => {
  it('uses the approved attribution verbatim', () => {
    expect(BRANDING.attribution).toBe(
      'Created by Dr Hazel Farrell in collaboration with Ken McCarthy, with support from ChatGPT and Claude Code.',
    )
    expect(sources['../src/pages/About.tsx']).toContain('BRANDING.attribution')
  })

  it('names SETU only in migration, provenance and history notes', () => {
    const files = Object.entries(sources)
      .filter(([f, src]) => /SETU/.test(src) && !MAY_NAME_SETU.includes(f))
      .filter(([f]) => !f.includes('/legacy/') && !f.includes('/migrate/'))
      .map(([f]) => f)
    expect(files).toEqual([])
  })

  it('never abbreviates the network name to "GenAI"', () => {
    // "GenAI" for generative AI as a topic (e.g. "Effective use of GenAI") is fine; naming the
    // network or publisher must always use "GenAI:N3" in full.
    const shortened =
      /\bGenAI\b(?!:N3)\s+(resource|network|team|edition)|\b(by|from|to) GenAI\b(?!:N3)/
    for (const [file, src] of Object.entries(sources)) expect(src, file).not.toMatch(shortened)
    expect(BRANDING.publisher).toBe('A GenAI:N3 resource')
  })

  it('carries the public identity in the page metadata', () => {
    const html = readRoot('index.html')
    expect(html).toContain('<title>AI Integration Review — A GenAI:N3 resource</title>')
    expect(html).not.toMatch(/SETU|favicon\.svg/)
  })

  it('shows the preview notice and noindex only in the preview build', () => {
    expect(IS_PREVIEW).toBe(false)
    expect(readRoot('index.html')).not.toContain('noindex')
    expect(sources['../src/components/layout/Shell.tsx']).toContain('{IS_PREVIEW && (')
  })
})

describe('feedback link', () => {
  it('goes to the feedback address with only the version in the subject', () => {
    const url = feedbackMailto('1.2.3')
    expect(url).toBe(
      `mailto:air@genain3.ie?subject=${encodeURIComponent('AI Integration Review feedback — v1.2.3')}`,
    )
    expect(url).not.toContain('body=')
  })
})

describe('versions', () => {
  it('takes the application version from package.json, separate from the schema version', () => {
    const pkg = JSON.parse(readRoot('package.json'))
    expect(APP_VERSION).toBe(pkg.version)
    expect(versionLabel()).toBe(`v${pkg.version}`)
    expect(versionLabel()).not.toBe(`v${SCHEMA_VERSION_V2}`)
    expect(sources['../src/components/layout/Footer.tsx']).toContain('versionLabel()')
    expect(sources['../src/pages/About.tsx']).toContain('versionLabel(APP_VERSION)')
  })
})

describe('licensing files', () => {
  it('ships the licences and notices', () => {
    for (const f of ['LICENSE', 'CONTENT-LICENSE.md', 'BRANDING.md', 'THIRD-PARTY-NOTICES.md'])
      expect(readRoot(f), f).toBeTruthy()
    expect(readRoot('LICENSE')).toContain('GNU GENERAL PUBLIC LICENSE\n')
    expect(JSON.parse(readRoot('package.json')).license).toBe('GPL-3.0-or-later')
    expect(readRoot('README.md')).toContain('any later version')
  })
})
