/**
 * Per-browser conveniences, kept apart from reviews. The remembered institution name only
 * pre-fills new reviews: it never changes an existing review and is never exported or sent
 * anywhere.
 */
import { STORAGE_PREFIX } from '../config/branding'

export const INSTITUTION_PREF_KEY = `${STORAGE_PREFIX}:pref:institutionName`

export function rememberedInstitution(storage: Storage): string {
  try {
    return storage.getItem(INSTITUTION_PREF_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Record the name the user has just typed; clearing the field forgets it. */
export function rememberInstitution(storage: Storage, name: string): void {
  const value = name.trim()
  try {
    if (value) storage.setItem(INSTITUTION_PREF_KEY, value)
    else storage.removeItem(INSTITUTION_PREF_KEY)
  } catch {
    // A preference is not worth a warning; the review itself is still saved (or reported).
  }
}
