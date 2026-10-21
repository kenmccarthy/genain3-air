/**
 * The v2 app state: the list of saved reviews and the review currently open. Each change to the
 * open review is saved straight to its own storage entry (see library.ts). This does not use
 * zustand's persist middleware.
 *
 * A change is always kept in memory first. If the browser then refuses to store it (for example
 * because storage is full), the review stays open with the change, is listed in `unsaved`, and
 * `saveError` says why, so the page can warn the user and offer an export that includes it.
 */
import { create } from 'zustand'
import { produce, type Draft } from 'immer'
import type { AnyReview, ModuleReview, ProgrammeReview, ReviewKind } from '../model/v2/schema'
import { newModuleReview, newProgrammeReview } from '../model/v2/defaults'
import {
  browserStorage,
  deleteReview,
  listReviews,
  loadReview,
  saveReview,
  storageErrorMessage,
  type IndexEntry,
} from './library'
import { rememberInstitution, rememberedInstitution } from './preferences'

export interface WorkspaceState {
  storage: Storage
  /** False when the browser blocks localStorage: work lasts only until the tab is closed. */
  persistent: boolean
  entries: IndexEntry[]
  current: AnyReview | null
  /** Id of the last review that could not be opened (missing or unreadable). */
  failedId: string | null
  /** Reviews whose latest changes are only in memory because saving them failed, by id. */
  unsaved: Record<string, AnyReview>
  /** Why the most recent save failed, in plain language; null once a save succeeds again. */
  saveError: string | null
  /** Re-read the saved-review list (after imports or migration). */
  refresh: () => void
  /** Open a saved review; returns it, or undefined if no review has that id. */
  open: (id: string) => AnyReview | undefined
  /**
   * Open a new, not yet saved, review. It is saved on its first change. Its Institution Name is
   * the one last typed in this browser, unless `partial` gives one.
   */
  createProgramme: (partial?: Partial<ProgrammeReview>) => ProgrammeReview
  createModule: (partial?: Partial<ModuleReview>) => ModuleReview
  /** Change the open review inside an immer draft; it is saved immediately. */
  update: <T extends AnyReview>(fn: (draft: Draft<T>) => void) => void
  /** Replace the open review wholesale (e.g. after a pure exchange function) and save it. */
  replace: (review: AnyReview) => void
  /** Set the open review's Institution Name and remember it for new reviews in this browser. */
  setInstitution: (name: string) => void
  remove: (id: string) => void
  /** Use another storage (tests). */
  useStorage: (storage: Storage, persistent?: boolean) => void
}

const initial = typeof window === 'undefined' ? null : browserStorage()

export const useWorkspace = create<WorkspaceState>()((set, get) => {
  const save = (review: AnyReview) => {
    set({ current: review })
    const { [review.id]: _, ...others } = get().unsaved
    try {
      const stored = saveReview(get().storage, review)
      set({
        current: get().current?.id === review.id ? stored : get().current,
        entries: listReviews(get().storage),
        unsaved: others,
        saveError: Object.keys(others).length ? get().saveError : null,
      })
    } catch (e) {
      set({ unsaved: { ...others, [review.id]: review }, saveError: storageErrorMessage(e) })
    }
    return review
  }
  const prefill = <T extends { institutionName?: string }>(partial: T): T =>
    partial.institutionName === undefined
      ? { ...partial, institutionName: rememberedInstitution(get().storage) }
      : partial
  return {
    storage: initial?.storage ?? (undefined as unknown as Storage),
    persistent: initial?.persistent ?? false,
    entries: initial ? listReviews(initial.storage) : [],
    current: null,
    failedId: null,
    unsaved: {},
    saveError: null,
    refresh: () => set({ entries: listReviews(get().storage) }),
    open: (id) => {
      const cur = get().current
      if (cur?.id === id) return cur
      // A review that could not be saved is opened from memory, with its latest changes.
      const review = get().unsaved[id] ?? loadReview(get().storage, id)
      set({ current: review ?? null, failedId: review ? null : id })
      return review
    },
    // A new review is opened but not saved until something is entered, so starting a review and
    // leaving straight away does not leave an empty review behind.
    createProgramme: (partial = {}) => {
      const r = newProgrammeReview(prefill(partial))
      set({ current: r, failedId: null })
      return r
    },
    createModule: (partial = {}) => {
      const r = newModuleReview(prefill(partial))
      set({ current: r, failedId: null })
      return r
    },
    update: (fn) => {
      const cur = get().current
      if (!cur) return
      const next = produce(cur, (draft) => {
        fn(draft as Draft<never>)
        draft.updatedAt = new Date().toISOString()
      })
      save(next)
    },
    replace: (review) => save(review),
    setInstitution: (name) => {
      get().update((d) => void (d.institutionName = name))
      rememberInstitution(get().storage, name)
    },
    remove: (id) => {
      deleteReview(get().storage, id)
      const { [id]: _, ...unsaved } = get().unsaved
      set({
        entries: listReviews(get().storage),
        current: get().current?.id === id ? null : get().current,
        unsaved,
        saveError: Object.keys(unsaved).length ? get().saveError : null,
      })
    },
    useStorage: (storage, persistent = true) =>
      set({
        storage,
        persistent,
        entries: listReviews(storage),
        current: null,
        unsaved: {},
        saveError: null,
      }),
  }
})

/** The open review, if it is of the given kind. */
export function useCurrent<K extends ReviewKind>(kind: K) {
  return useWorkspace((s) =>
    s.current?.kind === kind ? (s.current as Extract<AnyReview, { kind: K }>) : undefined,
  )
}
