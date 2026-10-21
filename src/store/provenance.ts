/**
 * Institution Name for imported reviews. A name already in a file is always kept as it is. Only
 * the SETU edition's original single-review tool wrote version 1 files, so those are named after
 * SETU. A version 2 review with no institution name field could have come from the SETU edition
 * or elsewhere (the format is shared), so the user is asked about each one, and the default is to
 * leave the name blank. The `generator` field is never used for this: it is not proof of origin.
 */
import type { AnyReview } from '../model/v2/schema'

export const SETU_INSTITUTION = 'South East Technological University'

export function withInstitution<T extends AnyReview>(review: T, institutionName: string): T {
  return { ...review, institutionName }
}

/**
 * Ids of the reviews in a raw (unvalidated) file that have no `institutionName` field at all.
 * An empty value still counts as present: someone chose to leave it blank.
 */
export function reviewsWithoutInstitution(doc: Record<string, unknown>): string[] {
  const reviews = doc.packetType === 'library' ? doc.reviews : [doc]
  if (!Array.isArray(reviews)) return []
  return reviews
    .filter(
      (r): r is Record<string, unknown> =>
        !!r && typeof r === 'object' && !Array.isArray(r) && !('institutionName' in r),
    )
    .map((r) => r.id)
    .filter((id): id is string => typeof id === 'string')
}
