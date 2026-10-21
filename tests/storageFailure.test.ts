import { beforeEach, describe, expect, it } from 'vitest'
import { useWorkspace } from '../src/store/workspace'
import {
  INDEX_KEY,
  importIntoLibrary,
  libraryBundle,
  listReviews,
  loadReview,
  saveReview,
} from '../src/store/library'
import { parseImport } from '../src/store/importV2'
import { newModuleReview } from '../src/model/v2/defaults'
import type { ModuleReview } from '../src/model/v2/schema'
import { MemoryStorage } from './memoryStorage'
import { fixture } from './fixtures'

const ws = () => useWorkspace.getState()
const never = () => {
  throw new Error('no conflict expected')
}

/** A storage that accepts `ok` more writes and then refuses every write, as when full. */
function fillsUpAfter(ok: number) {
  return new MemoryStorage(ok)
}
const setTitle = (title: string) => ws().update<ModuleReview>((d) => void (d.title = title))

describe('when the browser refuses to save', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = fillsUpAfter(Infinity)
    ws().useStorage(storage)
  })

  it('keeps the change open in memory, marks it unsaved and says why', () => {
    const m = ws().createModule()
    setTitle('Saved title')
    storage.failAfter = storage.writes // every further write fails
    setTitle('Unsaved title')
    expect(ws().current?.title).toBe('Unsaved title')
    expect(ws().unsaved[m.id]?.title).toBe('Unsaved title')
    expect(ws().saveError).toContain('storage for the site is full')
    // The stored copy is the last one that saved.
    expect(loadReview(storage, m.id)?.title).toBe('Saved title')
  })

  it('keeps a brand-new review that could not be saved even once', () => {
    storage.failAfter = 0
    const m = ws().createModule()
    setTitle('Never stored')
    expect(ws().current?.title).toBe('Never stored')
    expect(ws().unsaved[m.id]).toBeDefined()
    expect(ws().entries).toEqual([])
  })

  it('still exports the latest changes, for the review and for the whole library', () => {
    const m = ws().createModule()
    setTitle('Saved title')
    storage.failAfter = storage.writes
    setTitle('Unsaved title')
    // "Export this review" exports the open review from memory.
    expect(JSON.parse(JSON.stringify(ws().current)).title).toBe('Unsaved title')
    const bundle = libraryBundle(storage, undefined, ws().unsaved)
    expect(bundle.reviews.map((r) => r.title)).toEqual(['Unsaved title'])
    expect(bundle.reviews[0].id).toBe(m.id)
  })

  it('reopens an unsaved review from memory after moving to another', () => {
    const a = ws().createModule()
    setTitle('A saved')
    storage.failAfter = storage.writes
    setTitle('A unsaved')
    ws().open('somewhere-else')
    expect(ws().open(a.id)?.title).toBe('A unsaved')
  })

  it('clears the warning once a later save succeeds', () => {
    const m = ws().createModule()
    setTitle('one')
    storage.failAfter = storage.writes
    setTitle('two')
    expect(ws().saveError).not.toBeNull()
    storage.failAfter = Infinity
    setTitle('three')
    expect(ws().saveError).toBeNull()
    expect(ws().unsaved).toEqual({})
    expect(loadReview(storage, m.id)?.title).toBe('three')
  })

  it('never leaves a review and the index disagreeing when only the index write fails', () => {
    const s = fillsUpAfter(1) // the review entry is written, then the index write fails
    const m = newModuleReview({ title: 'Half saved' })
    expect(() => saveReview(s, m)).toThrow()
    expect(loadReview(s, m.id)).toBeUndefined()
    expect(s.getItem(INDEX_KEY)).toBeNull()

    // The longer title fits in the review entry but leaves no room for the index entry.
    const t = new MemoryStorage()
    saveReview(t, { ...m, title: 'Before' })
    const longer = 'After, with a much longer title'
    t.capacity = t.used + (longer.length - 'Before'.length)
    expect(() => saveReview(t, { ...m, title: longer })).toThrow()
    expect(loadReview(t, m.id)?.title).toBe('Before')
    expect(listReviews(t)[0].title).toBe('Before')
  })

  it('imports nothing, and says so, when storage fills up part-way through a file', () => {
    const s = new MemoryStorage()
    saveReview(s, newModuleReview({ title: 'Existing' }))
    const before = s.keys().sort()
    const indexBefore = s.getItem(INDEX_KEY)
    // Room for about two of the four reviews in the file.
    s.capacity = s.used + Math.round(fixture('setu-v2-library.json').length / 2)
    const r = importIntoLibrary(s, parseImport(fixture('setu-v2-library.json')), never)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toMatch(/^Nothing was imported because/)
    expect(s.keys().sort()).toEqual(before)
    expect(s.getItem(INDEX_KEY)).toBe(indexBefore)
  })
})
