import { describe, expect, it } from 'vitest'
import { parseImport } from '../src/store/importV2'
import { importIntoLibrary, listReviews, loadReview } from '../src/store/library'
import { SETU_INSTITUTION } from '../src/store/provenance'
import { saveSample } from '../src/features/home/sample'
import { useWorkspace } from '../src/store/workspace'
import type { AnyReview } from '../src/model/v2/schema'
import { MemoryStorage } from './memoryStorage'
import { fixture } from './fixtures'

const never = () => {
  throw new Error('no conflict expected')
}
const institutions = (s: Storage) => listReviews(s).map((e) => loadReview(s, e.id)!.institutionName)

describe('Institution Name on import', () => {
  it('names SETU on reviews brought in from a v1 file, and the name stays editable', () => {
    const s = new MemoryStorage()
    const parsed = parseImport(fixture('setu-v1-review.json'))
    expect(parsed.ok && parsed.type).toBe('v1-review')
    const r = importIntoLibrary(s, parsed, never)
    expect(r.ok && r.message).toContain(SETU_INSTITUTION)
    expect(institutions(s)).toEqual([SETU_INSTITUTION, SETU_INSTITUTION, SETU_INSTITUTION])

    const ws = useWorkspace.getState()
    ws.useStorage(s)
    ws.open(listReviews(s)[0].id)
    useWorkspace.getState().setInstitution('')
    expect(loadReview(s, listReviews(s)[0].id)!.institutionName).toBe('')
  })

  it('lists a v2 review with no institution field for the user to decide about', () => {
    const parsed = parseImport(fixture('setu-v2-module.json'))
    if (!parsed.ok || parsed.type !== 'review') throw new Error('expected a review')
    expect(parsed.withoutInstitution).toEqual([parsed.review.id])
    expect(parsed.review.institutionName).toBe('')
  })

  it('leaves Institution Name blank unless the user says the file is from SETU', () => {
    const s = new MemoryStorage()
    importIntoLibrary(s, parseImport(fixture('setu-v2-module.json')), never)
    expect(institutions(s)).toEqual([''])

    const t = new MemoryStorage()
    const parsed = parseImport(fixture('setu-v2-module.json'))
    if (!parsed.ok || parsed.type !== 'review') throw new Error('expected a review')
    const r = importIntoLibrary(t, parsed, never, { setuOrigin: new Set([parsed.review.id]) })
    expect(institutions(t)).toEqual([SETU_INSTITUTION])
    expect(r.ok && r.message).toContain(
      `Institution Name was set to ${SETU_INSTITUTION} on 1 review`,
    )
  })

  it('keeps a name already in the file, even an empty one, without asking', () => {
    const named = JSON.parse(fixture('setu-v2-module.json'))
    for (const value of ['Example University', '']) {
      const parsed = parseImport(JSON.stringify({ ...named, institutionName: value }))
      if (!parsed.ok || parsed.type !== 'review') throw new Error('expected a review')
      expect(parsed.withoutInstitution).toEqual([])
      const s = new MemoryStorage()
      // Even if the caller wrongly lists it, a review with its own field is never renamed.
      importIntoLibrary(s, parsed, never)
      expect(institutions(s)).toEqual([value])
    }
  })

  it('decides each review in a bundle separately', () => {
    const bundle = JSON.parse(fixture('setu-v2-library.json'))
    // A mixed bundle: one review already names its institution.
    bundle.reviews[0].institutionName = 'Another Institute'
    const parsed = parseImport(JSON.stringify(bundle))
    if (!parsed.ok || parsed.type !== 'library') throw new Error('expected a bundle')
    const ids = bundle.reviews.map((r: AnyReview) => r.id)
    expect(parsed.withoutInstitution).toEqual(ids.slice(1))

    const s = new MemoryStorage()
    const ticked = new Set([ids[2]])
    importIntoLibrary(s, parsed, never, { setuOrigin: ticked })
    const byId = Object.fromEntries(
      ids.map((id: string) => [id, loadReview(s, id)!.institutionName]),
    )
    expect(byId).toEqual({
      [ids[0]]: 'Another Institute',
      [ids[1]]: '',
      [ids[2]]: SETU_INSTITUTION,
      [ids[3]]: '',
    })
  })

  it('ignores the generator marker, which is not proof of origin', () => {
    const raw = JSON.parse(fixture('setu-v2-module.json'))
    for (const generator of [
      undefined,
      { app: 'genain3-air', version: '9.9.9' },
      { app: 'x', version: '1' },
    ]) {
      const parsed = parseImport(JSON.stringify({ ...raw, generator }))
      if (!parsed.ok || parsed.type !== 'review') throw new Error('expected a review')
      expect(parsed.withoutInstitution).toEqual([raw.id])
    }
  })

  it('never names the sample', () => {
    const s = new MemoryStorage()
    saveSample(s)
    expect(institutions(s).every((n) => n === '')).toBe(true)
  })
})
