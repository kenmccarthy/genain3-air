/**
 * Data preservation and compatibility with the SETU edition, using files produced by the SETU
 * edition's own code (tests/fixtures/README.md) and a frozen copy of its schema
 * (tests/compat/setu/README.md).
 */
import { describe, expect, it } from 'vitest'
import { parseImport } from '../src/store/importV2'
import { importIntoLibrary, libraryBundle, loadReview } from '../src/store/library'
import { unknownFields } from '../src/store/unknownFields'
import { useWorkspace } from '../src/store/workspace'
import { moduleContributionPacket } from '../src/logic/v2/exchange'
import { programmeSummaryText } from '../src/logic/v2/programmeSummary'
import { statementText } from '../src/logic/v2/statement'
import type { AnyReview, ModuleReview, ProgrammeReview } from '../src/model/v2/schema'
import {
  AnyReviewSchema as SetuReviewSchema,
  LibraryBundleSchema as SetuLibrarySchema,
  ModuleContributionPacketSchema as SetuContributionSchema,
} from './compat/setu/src/model/v2/schema'
import { MemoryStorage } from './memoryStorage'
import { fixture } from './fixtures'

const never = () => {
  throw new Error('no conflict expected')
}

/** Fields this edition adds to every file. The SETU edition at 8acfcc8 does not keep them. */
export const ADDED_FIELDS = [
  'generator',
  'institutionName',
  'qualificationFramework',
  'creditSystem',
]

/** Remove the fields this edition adds, at any depth, so files can be compared with the originals. */
function withoutAdded(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutAdded)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !ADDED_FIELDS.includes(k))
        .map(([k, v]) => [k, withoutAdded(v)]),
    )
  return value
}

const exported = (r: unknown) => JSON.parse(JSON.stringify(r))

/** Import a file into empty storage, then read every review back as it would be exported. */
function importAndExport(name: string) {
  const s = new MemoryStorage()
  const r = importIntoLibrary(s, parseImport(fixture(name)), never)
  if (!r.ok) throw new Error(r.error)
  return { s, reviews: r.saved.map((x) => exported(loadReview(s, x.id))) as AnyReview[] }
}

describe('SETU v2 files imported into this edition', () => {
  it.each(['setu-v2-programme.json', 'setu-v2-module.json'])(
    'keeps all of %s through import, save, reload and export',
    (name) => {
      const raw = JSON.parse(fixture(name))
      const [back] = importAndExport(name).reviews
      expect(withoutAdded(back)).toEqual(raw)
    },
  )

  it('keeps every review in a SETU library bundle', () => {
    const raw = JSON.parse(fixture('setu-v2-library.json'))
    const { s } = importAndExport('setu-v2-library.json')
    const bundle = exported(libraryBundle(s, raw.exportedAt))
    expect(withoutAdded(bundle)).toEqual(raw)
  })

  it('keeps content through editing and saving in the workspace', () => {
    const { s, reviews } = importAndExport('setu-v2-programme.json')
    const raw = JSON.parse(fixture('setu-v2-programme.json'))
    const ws = useWorkspace.getState()
    ws.useStorage(s)
    ws.open(reviews[0].id)
    useWorkspace.getState().update<ProgrammeReview>((d) => void (d.team = 'Edited team'))
    const back = exported(loadReview(s, reviews[0].id))
    expect(withoutAdded(back)).toEqual({ ...raw, team: 'Edited team', updatedAt: back.updatedAt })
  })

  it('keeps the agreed statement, its approval and its text', () => {
    const [p] = importAndExport('setu-v2-programme.json').reviews as ProgrammeReview[]
    expect(p.statement.status).toBe('agreed')
    expect(p.statement.approvedBy).toBe('Programme board')
    expect(statementText(p)).toBe(p.statement.agreedSnapshot)
  })

  it('keeps a programme duration without displaying it', () => {
    const [p] = importAndExport('setu-v2-programme.json').reviews as ProgrammeReview[]
    expect(p.duration).toBe('4 years')
    expect(programmeSummaryText(p)).not.toContain('4 years')
  })

  it('reads SETU programme files as NFQ and module files as ECTS', () => {
    const [p] = importAndExport('setu-v2-programme.json').reviews as ProgrammeReview[]
    const [m] = importAndExport('setu-v2-module.json').reviews as ModuleReview[]
    expect(p.qualificationFramework).toBe('NFQ')
    expect(m.creditSystem).toBe('ECTS')
  })

  it('accepts the SETU exchange packets', () => {
    for (const name of ['setu-module-contribution.json', 'setu-programme-prompts.json']) {
      const parsed = parseImport(fixture(name))
      expect(parsed.ok, name).toBe(true)
      expect(parsed.ok && parsed.unknownFields, name).toEqual([])
    }
  })
})

describe('SETU v1 files imported into this edition', () => {
  it('keeps the original v1 review unchanged with the migrated reviews', () => {
    const raw = JSON.parse(fixture('setu-v1-review.json'))
    const { reviews } = importAndExport('setu-v1-review.json')
    const programme = reviews.find((r) => r.kind === 'programme')!
    expect(programme.legacy?.original).toEqual(raw)
    expect(reviews.filter((r) => r.kind === 'module')).toHaveLength(raw.modules.length)
  })
})

describe('fields this edition does not know', () => {
  it('are kept on import and exported again unchanged, and reported', () => {
    const raw = JSON.parse(fixture('unknown-fields-module.json'))
    const parsed = parseImport(fixture('unknown-fields-module.json'))
    if (!parsed.ok) throw new Error(parsed.error)
    expect(parsed.unknownFields.sort()).toEqual(
      ['assessments[].markingScheme', 'nextSteps[].owner', 'reviewRound', 'statementDraft'].sort(),
    )
    const s = new MemoryStorage()
    const r = importIntoLibrary(s, parsed, never)
    expect(r.ok && r.message).toContain('4 fields this edition does not use')
    const back = exported(loadReview(s, raw.id)) as Record<string, unknown>
    expect(back.reviewRound).toBe('2027 spring')
    expect(back.statementDraft).toBe('kept verbatim')
    expect(back.assessments).toMatchObject([{ markingScheme: { criteria: 4 } }])
    expect(back.nextSteps).toEqual([
      { id: 'n1', text: 'Pilot an oral check.', owner: 'Module team' },
    ])
  })

  it('are never passed on in a module contribution', () => {
    const [m] = importAndExport('unknown-fields-module.json').reviews as ModuleReview[]
    const text = JSON.stringify(moduleContributionPacket(m))
    for (const f of ['reviewRound', 'statementDraft', 'markingScheme', 'owner'])
      expect(text).not.toContain(f)
  })
})

describe('files from this edition imported into the SETU edition', () => {
  // What the SETU edition at 8acfcc8 accepts, and which fields it would drop. Keep this list in
  // step with docs/compatibility.md.
  const DROPPED_BY_SETU = {
    programme: ['generator', 'institutionName', 'qualificationFramework'],
    module: ['generator', 'institutionName', 'creditSystem'],
  }

  it('are accepted, dropping only the documented fields', () => {
    const [p] = importAndExport('setu-v2-programme.json').reviews
    const [m] = importAndExport('setu-v2-module.json').reviews
    for (const r of [p, m]) {
      expect(SetuReviewSchema.safeParse(r).success).toBe(true)
      const top = unknownFields(SetuReviewSchema, r).filter(
        (f) => !f.includes('.') && !f.includes('['),
      )
      expect(top.sort()).toEqual([...DROPPED_BY_SETU[r.kind]].sort())
    }
    // Nested: a programme also loses Institution Name and credit system from each contribution.
    expect(
      unknownFields(SetuReviewSchema, p)
        .filter((f) => f.includes('.'))
        .sort(),
    ).toEqual([
      'moduleContributions[].snapshot.creditSystem',
      'moduleContributions[].snapshot.institutionName',
    ])
  })

  it('accepts a library bundle and a module contribution from this edition', () => {
    const { s, reviews } = importAndExport('setu-v2-library.json')
    expect(SetuLibrarySchema.safeParse(exported(libraryBundle(s))).success).toBe(true)
    const m = reviews.find((r) => r.kind === 'module') as ModuleReview
    expect(SetuContributionSchema.safeParse(exported(moduleContributionPacket(m))).success).toBe(
      true,
    )
  })

  it('round-trips through the SETU edition with only the documented loss', () => {
    const [ours] = importAndExport('unknown-fields-module.json').reviews
    // The SETU edition parses (dropping unknown fields) and exports the result...
    const viaSetu = exported(SetuReviewSchema.parse(ours))
    // ...and this edition reads that back.
    const parsed = parseImport(JSON.stringify(viaSetu))
    if (!parsed.ok || parsed.type !== 'review') throw new Error('expected a review')
    const back = parsed.review as ModuleReview
    expect(back.institutionName).toBe('') // lost: was "Example University"
    expect(back.creditSystem).toBe('ECTS') // lost: was "UK credits"
    expect(parsed.withoutInstitution).toEqual([back.id]) // so the user is asked again
    expect(back.title).toBe('Research Methods')
    expect(back.credits).toBe('15')
  })
})

describe('imported text', () => {
  it('is kept as plain text and never interpreted', () => {
    const raw = JSON.parse(fixture('markup-in-strings.json'))
    const [p] = importAndExport('markup-in-strings.json').reviews as ProgrammeReview[]
    expect(p.title).toBe(raw.title)
    expect(p.institutionName).toBe(raw.institutionName)
    expect(p.priorities[0].text).toBe(raw.priorities[0].text)
  })

  it('is never rendered as HTML anywhere in the app', () => {
    const sources = import.meta.glob('../src/**/*.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    for (const [file, src] of Object.entries(sources)) {
      expect(src, file).not.toMatch(
        /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|new Function\(/,
      )
    }
  })
})
