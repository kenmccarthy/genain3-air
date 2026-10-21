import { describe, expect, it } from 'vitest'
import { MODULE_SECTIONS, PROGRAMME_SECTIONS, navFor } from '../src/components/layout/nav'

const paths = (kind: 'programme' | 'module') =>
  navFor(kind, 'r1').flatMap((g) => g.items.map((i) => i.to))

describe('context-aware navigation', () => {
  it('shows only module sections in a module review', () => {
    const p = paths('module')
    expect(p.filter((x) => x.startsWith('/programme'))).toEqual([])
    expect(p).toContain('/module/r1/assessment')
    expect(p.some((x) => x.includes('statement'))).toBe(false)
  })
  it('shows programme sections and the statement in a programme review', () => {
    const p = paths('programme')
    expect(p.filter((x) => x.startsWith('/module'))).toEqual([])
    expect(p).toContain('/programme/r1/statement')
  })
  it('numbers the five programme and four module review sections', () => {
    expect(PROGRAMME_SECTIONS.filter((s) => 'number' in s)).toHaveLength(5)
    expect(MODULE_SECTIONS.filter((s) => 'number' in s)).toHaveLength(4)
  })
  it('offers a way home from every context', () => {
    for (const nav of [navFor(), navFor('programme', 'x'), navFor('module', 'x')])
      expect(nav.flatMap((g) => g.items).some((i) => i.to === '/')).toBe(true)
  })
})

describe('storage isolation', () => {
  // The SETU edition uses the keys `setu-ai-review` (v1) and `setu-air:v2:*`. This edition must
  // never read or write them, so no source file may name them, and no code may use zustand's
  // persist middleware (which wrote the v1 key).
  const sources = import.meta.glob('../src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  it("never names the SETU edition's storage keys", () => {
    const files = Object.entries(sources)
      .filter(([, src]) => /'setu-ai-review'|['`]setu-air:/.test(src))
      .map(([f]) => f)
    expect(files).toEqual([])
  })

  it('does not use the persist middleware anywhere', () => {
    expect(Object.entries(sources).filter(([, src]) => /zustand\/middleware'/.test(src))).toEqual(
      [],
    )
  })
})
