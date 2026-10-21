import { beforeEach, describe, expect, it } from 'vitest'
import { useWorkspace } from '../src/store/workspace'
import { loadReview } from '../src/store/library'
import { parseImport } from '../src/store/importV2'
import { importIntoLibrary } from '../src/store/library'
import { INSTITUTION_PREF_KEY, rememberedInstitution } from '../src/store/preferences'
import { MemoryStorage } from './memoryStorage'
import { fixture } from './fixtures'

const ws = () => useWorkspace.getState()
let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  ws().useStorage(storage)
})

describe('remembered Institution Name', () => {
  it('is pre-filled in new programme and module reviews once the user has typed it', () => {
    expect(ws().createProgramme().institutionName).toBe('')
    ws().setInstitution('Example University')
    expect(rememberedInstitution(storage)).toBe('Example University')
    expect(ws().createModule().institutionName).toBe('Example University')
    expect(ws().createProgramme().institutionName).toBe('Example University')
  })

  it('never changes reviews that already exist', () => {
    const first = ws().createModule()
    ws().setInstitution('First Institute')
    ws().createModule()
    ws().setInstitution('Second Institute')
    expect(loadReview(storage, first.id)?.institutionName).toBe('First Institute')
  })

  it('can be cleared, in a review and as the remembered default', () => {
    ws().createProgramme()
    ws().setInstitution('Example University')
    ws().setInstitution('')
    expect(storage.getItem(INSTITUTION_PREF_KEY)).toBeNull()
    expect(ws().createModule().institutionName).toBe('')
  })

  it('is not set by imports', () => {
    importIntoLibrary(storage, parseImport(fixture('setu-v1-review.json')), () => 'keep-both')
    importIntoLibrary(
      storage,
      parseImport(fixture('unknown-fields-module.json')),
      () => 'keep-both',
    )
    expect(rememberedInstitution(storage)).toBe('')
  })
})
