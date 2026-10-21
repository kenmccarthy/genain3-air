/**
 * Browser-local storage for v2: an index of saved reviews plus one entry per review, so starting
 * or importing a review never overwrites another. Functions take a `Storage` so they can be
 * tested without a browser.
 *
 * Every key starts with STORAGE_PREFIX, which differs from the SETU edition's, so this edition
 * never reads or writes another edition's reviews. Reviews move between editions only as files.
 */
import { z } from 'zod'
import { GENERATOR, STORAGE_PREFIX } from '../config/branding'
import { migrateV1Review } from '../migrate/v1ToV2'
import { uid } from '../model/v2/defaults'
import {
  AnyReviewSchema,
  SCHEMA_VERSION_V2,
  type AnyReview,
  type LibraryBundle,
  type ReviewKind,
} from '../model/v2/schema'
import type { ParsedImport } from './importV2'
import { SETU_INSTITUTION, withInstitution } from './provenance'

export const INDEX_KEY = `${STORAGE_PREFIX}:v2:index`
export const reviewKey = (id: string) => `${STORAGE_PREFIX}:v2:review:${id}`
const PROBE_KEY = `${STORAGE_PREFIX}:v2:probe`

const IndexEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(['programme', 'module']),
  title: z.string().default(''),
  code: z.string().default(''),
  updatedAt: z.string(),
  status: z.enum(['in_progress', 'complete']).default('in_progress'),
})
export type IndexEntry = z.infer<typeof IndexEntrySchema>

const IndexSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION_V2).default(SCHEMA_VERSION_V2),
  reviews: z.array(IndexEntrySchema).default([]),
})
export type LibraryIndex = z.infer<typeof IndexSchema>

export function readIndex(storage: Storage): LibraryIndex {
  const raw = storage.getItem(INDEX_KEY)
  if (!raw) return IndexSchema.parse({})
  try {
    return IndexSchema.parse(JSON.parse(raw))
  } catch {
    return IndexSchema.parse({})
  }
}

function writeIndex(storage: Storage, index: LibraryIndex) {
  storage.setItem(INDEX_KEY, JSON.stringify(index))
}

export function indexEntry(review: AnyReview): IndexEntry {
  return {
    id: review.id,
    kind: review.kind,
    title: review.title,
    code: review.kind === 'module' ? review.code : '',
    updatedAt: review.updatedAt,
    status: review.status,
  }
}

export function listReviews(storage: Storage, kind?: ReviewKind): IndexEntry[] {
  return readIndex(storage)
    .reviews.filter((r) => !kind || r.kind === kind)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function loadReview(storage: Storage, id: string): AnyReview | undefined {
  const raw = storage.getItem(reviewKey(id))
  if (!raw) return undefined
  try {
    const result = AnyReviewSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

/**
 * Save one review and its index entry, and return the review as stored. Throws if the browser
 * refuses the write (e.g. storage is full). The review and the index are never left disagreeing:
 * if the index cannot be written, the review entry is put back as it was.
 */
export function saveReview(storage: Storage, review: AnyReview): AnyReview {
  const stored = { ...review, generator: GENERATOR }
  const key = reviewKey(review.id)
  const previous = storage.getItem(key)
  storage.setItem(key, JSON.stringify(stored))
  try {
    const index = readIndex(storage)
    const entry = indexEntry(stored)
    const i = index.reviews.findIndex((r) => r.id === review.id)
    if (i >= 0) index.reviews[i] = entry
    else index.reviews.push(entry)
    writeIndex(storage, index)
  } catch (e) {
    restore(storage, key, previous)
    throw e
  }
  return stored
}

function restore(storage: Storage, key: string, previous: string | null) {
  try {
    if (previous === null) storage.removeItem(key)
    else storage.setItem(key, previous)
  } catch {
    // Putting back a value no larger than before is expected to succeed; if not, loadReview
    // still validates whatever is stored.
  }
}

/**
 * Save several reviews as one change: if any write fails, every review and the index are put
 * back as they were, and the error is thrown.
 */
export function saveReviews(storage: Storage, reviews: AnyReview[]): AnyReview[] {
  const previousIndex = storage.getItem(INDEX_KEY)
  const previous = reviews.map((r) => [reviewKey(r.id), storage.getItem(reviewKey(r.id))] as const)
  try {
    return reviews.map((r) => saveReview(storage, r))
  } catch (e) {
    for (const [key, value] of previous) restore(storage, key, value)
    restore(storage, INDEX_KEY, previousIndex)
    throw e
  }
}

/** A plain-language reason a save failed, for messages to the user. */
export function storageErrorMessage(e: unknown): string {
  const name = e instanceof Error ? `${e.name} ${e.message}` : String(e)
  return /quota/i.test(name)
    ? 'this browser’s storage for the site is full'
    : 'this browser did not allow the review to be saved'
}

export function deleteReview(storage: Storage, id: string): void {
  storage.removeItem(reviewKey(id))
  const index = readIndex(storage)
  index.reviews = index.reviews.filter((r) => r.id !== id)
  writeIndex(storage, index)
}

// ── Import and export ────────────────────────────────────────────────────────────────────────

export type ConflictChoice = 'replace' | 'keep-both'

export type LibraryImportResult =
  | { ok: true; saved: AnyReview[]; message: string }
  /** A packet meant for a particular review; the caller asks which review should receive it. */
  | { ok: true; saved: []; packet: ParsedPacket; message: string }
  | { ok: false; error: string }

type ParsedPacket = Extract<ParsedImport, { type: 'module-contribution' | 'programme-prompts' }>

const describe = (n: number, what: string) => `${n} ${what}${n === 1 ? '' : 's'}`

export interface ImportOptions {
  /**
   * Ids of reviews in the file that have no institution name field and that the user confirmed
   * were exported from the SETU edition: their Institution Name is set to the SETU name. Reviews
   * not listed are left blank.
   */
  setuOrigin?: ReadonlySet<string>
}

/**
 * Save the reviews in an imported file as new saved reviews. A v1 review is migrated into new
 * reviews and never replaces anything; a v2 review whose id is already saved is replaced or kept
 * alongside, as `onConflict` decides. Nothing is written if the file is invalid, and nothing is
 * kept if the browser refuses any of the writes.
 */
export function importIntoLibrary(
  storage: Storage,
  parsed: ParsedImport,
  onConflict: (existing: IndexEntry, incoming: AnyReview) => ConflictChoice,
  options: ImportOptions = {},
): LibraryImportResult {
  try {
    return importReviews(storage, parsed, onConflict, options)
  } catch (e) {
    return {
      ok: false,
      error: `Nothing was imported because ${storageErrorMessage(e)}. Your saved reviews have not been changed. Export reviews you no longer need and delete them from Saved reviews to make space, then try again.`,
    }
  }
}

function importReviews(
  storage: Storage,
  parsed: ParsedImport,
  onConflict: (existing: IndexEntry, incoming: AnyReview) => ConflictChoice,
  { setuOrigin = new Set() }: ImportOptions,
): LibraryImportResult {
  if (!parsed.ok) return parsed
  switch (parsed.type) {
    case 'module-contribution':
      return {
        ok: true,
        saved: [],
        packet: parsed,
        message: 'This file is a module contribution. Import it from a programme review.',
      }
    case 'programme-prompts':
      return {
        ok: true,
        saved: [],
        packet: parsed,
        message: 'This file holds programme prompts. Import it from a module review.',
      }
    case 'v1-review': {
      // Only the SETU edition's original single-review tool wrote version 1 files.
      const { programme, modules } = migrateV1Review(parsed.review)
      const reviews = [programme, ...modules].map((r) => withInstitution(r, SETU_INSTITUTION))
      saveReviews(storage, reviews)
      return {
        ok: true,
        saved: reviews,
        message: `Brought in a review from the SETU edition’s earlier single combined review as 1 programme review and ${describe(modules.length, 'module review')}. Institution Name has been set to ${SETU_INSTITUTION}; you can change or clear it on each review’s context page.${unknownNote(parsed.unknownFields, false)}`,
      }
    }
    case 'review':
    case 'library': {
      const incoming = parsed.type === 'review' ? [parsed.review] : parsed.bundle.reviews
      const index = readIndex(storage)
      // The SETU name goes only on reviews the user ticked, matched by their id in the file.
      const named = incoming.map((r) =>
        setuOrigin.has(r.id) ? withInstitution(r, SETU_INSTITUTION) : r,
      )
      const toSave = named.map((review) => {
        const existing = index.reviews.find((r) => r.id === review.id)
        return existing && onConflict(existing, review) === 'keep-both'
          ? { ...review, id: uid(), updatedAt: new Date().toISOString() }
          : review
      })
      const saved = saveReviews(storage, toSave)
      const n = named.filter((r, i) => r !== incoming[i]).length
      return {
        ok: true,
        saved,
        message: `Imported ${describe(saved.length, 'review')}.${n ? ` Institution Name was set to ${SETU_INSTITUTION} on ${describe(n, 'review')}.` : ''}${unknownNote(parsed.unknownFields)}`,
      }
    }
  }
}

/** Tells the user about fields in a file this edition does not define, and what became of them. */
export function unknownNote(paths: string[], kept = true): string {
  if (!paths.length) return ''
  const shown = paths.slice(0, 3).join(', ')
  return ` The file contains ${describe(paths.length, 'field')} this edition does not use (${shown}${paths.length > 3 ? ', …' : ''}). ${kept ? 'They have been kept unchanged and will be included when you export.' : 'They were not carried over.'}`
}

/**
 * Every saved review as one bundle. `unsaved` holds reviews whose latest changes could not be
 * saved: they are exported in place of (or as well as) their stored copies, so a backup taken
 * after a failed save still has the latest work.
 */
export function libraryBundle(
  storage: Storage,
  exportedAt = new Date().toISOString(),
  unsaved: Record<string, AnyReview> = {},
): LibraryBundle {
  const stored = listReviews(storage)
    .map((e) => unsaved[e.id] ?? loadReview(storage, e.id))
    .filter((r): r is AnyReview => !!r)
  const extra = Object.values(unsaved).filter((r) => !stored.some((s) => s.id === r.id))
  return {
    packetType: 'library',
    schemaVersion: SCHEMA_VERSION_V2,
    generator: GENERATOR,
    exportedAt,
    reviews: [...stored, ...extra],
  }
}

// ── Browser storage ──────────────────────────────────────────────────────────────────────────

/** In-memory Storage used when the browser blocks localStorage (e.g. some private windows). */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

/** The browser's localStorage if it works, otherwise an in-memory store (`persistent: false`). */
export function browserStorage(): { storage: Storage; persistent: boolean } {
  try {
    const s = window.localStorage
    s.setItem(PROBE_KEY, '1')
    s.removeItem(PROBE_KEY)
    return { storage: s, persistent: true }
  } catch {
    return { storage: new MemoryStorage(), persistent: false }
  }
}
