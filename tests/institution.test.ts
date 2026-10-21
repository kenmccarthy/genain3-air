import { describe, expect, it } from 'vitest'
import { migrateV1Review } from '../src/migrate/v1ToV2'
import { moduleSnapshot } from '../src/logic/v2/exchange'
import { moduleSummaryText, creditsText } from '../src/logic/v2/moduleSummary'
import { programmeSummaryText, qualificationLevel } from '../src/logic/v2/programmeSummary'
import { statementExport, statementText } from '../src/logic/v2/statement'
import { newModuleReview, newProgrammeReview } from '../src/model/v2/defaults'
import { sample } from './fixture'

const statementPage = import.meta.glob('../src/features/statement/StatementPage.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('Institution Name', () => {
  const { programme, modules } = migrateV1Review(sample())

  it('belongs to each review and appears in summaries and exports', () => {
    const p = { ...programme, institutionName: 'Example University' }
    const m = { ...modules[0], institutionName: 'Other College' }
    expect(programmeSummaryText(p)).toContain('Institution: Example University')
    expect(moduleSummaryText(m)).toContain('Institution: Other College')
    expect(moduleSnapshot(m).institutionName).toBe('Other College')
    expect(statementExport(p).institution).toBe('Example University')
    expect(JSON.parse(JSON.stringify(m)).institutionName).toBe('Other College')
  })

  it('is optional: a module review needs no programme or institution', () => {
    const m = newModuleReview({ title: 'Standalone' })
    expect(m.institutionName).toBe('')
    expect(moduleSummaryText(m)).not.toContain('Institution:')
  })

  it('never changes the statement narrative', () => {
    const named = { ...programme, institutionName: 'Example University' }
    expect(statementText(named)).toBe(statementText(programme))
    expect(statementText(named)).not.toContain('Example University')
  })

  it('is printed above the programme title only when entered', () => {
    const src = statementPage['../src/features/statement/StatementPage.tsx']
    const header = src.slice(src.indexOf('function PrintedStatement'))
    const inst = header.indexOf('r.institutionName.trim() &&')
    expect(inst).toBeGreaterThan(-1)
    expect(inst).toBeLessThan(header.indexOf('<h1'))
  })
})

describe('qualification frameworks and credit systems', () => {
  it('default to NFQ and ECTS', () => {
    expect(newProgrammeReview().qualificationFramework).toBe('NFQ')
    expect(newModuleReview().creditSystem).toBe('ECTS')
    expect(qualificationLevel({ nfqLevel: '8', qualificationFramework: 'NFQ' })).toBe('NFQ level 8')
    expect(creditsText({ credits: '10', creditSystem: 'ECTS' })).toBe('10 ECTS credits')
  })

  it('accept other frameworks and systems, or none, without conversion', () => {
    expect(qualificationLevel({ nfqLevel: '6', qualificationFramework: 'RQF' })).toBe('RQF level 6')
    expect(qualificationLevel({ nfqLevel: '6', qualificationFramework: '' })).toBe('Level 6')
    expect(qualificationLevel({ nfqLevel: '', qualificationFramework: 'NFQ' })).toBe('')
    expect(creditsText({ credits: '20', creditSystem: 'UK credits' })).toBe('20 UK credits')
    expect(creditsText({ credits: '3', creditSystem: 'US semester credits' })).toBe(
      '3 US semester credits',
    )
    expect(creditsText({ credits: '5', creditSystem: '' })).toBe('5 credits')
  })
})
