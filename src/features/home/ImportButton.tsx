import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/fields'
import { reviewPath } from '../../components/layout/nav'
import { reviewTitle } from '../../components/layout/labels'
import type { AnyReview } from '../../model/v2/schema'
import { readFileText } from '../../store/io'
import { parseImport, type ParsedImport } from '../../store/importV2'
import { importIntoLibrary } from '../../store/library'
import { useWorkspace } from '../../store/workspace'
import { ProvenanceDialog } from '../review/ProvenanceDialog'

/** Reviews in a parsed file that have no institution name field, which the user decides about. */
function reviewsToAsk(parsed: ParsedImport): AnyReview[] {
  if (!parsed.ok || (parsed.type !== 'review' && parsed.type !== 'library')) return []
  const reviews = parsed.type === 'review' ? [parsed.review] : parsed.bundle.reviews
  return reviews.filter((r) => parsed.withoutInstitution.includes(r.id))
}

/**
 * Imports a review file into the saved reviews without overwriting anything unless the user
 * chooses to replace a saved copy of the same review. For reviews whose file has no institution
 * name field, the user is first asked whether they came from the SETU edition.
 */
export function ImportButton({
  onMessage,
  label = 'Import existing review',
}: {
  onMessage: (message: string, tone: 'ok' | 'error') => void
  label?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const storage = useWorkspace((s) => s.storage)
  const refresh = useWorkspace((s) => s.refresh)
  const navigate = useNavigate()
  const [asking, setAsking] = useState<{ parsed: ParsedImport; reviews: AnyReview[] } | null>(null)

  const finish = (parsed: ParsedImport, setuOrigin: Set<string>) => {
    const result = importIntoLibrary(
      storage,
      parsed,
      (existing, incoming) =>
        confirm(
          `“${reviewTitle(incoming)}” is already saved in this browser (last changed ${new Date(existing.updatedAt).toLocaleString()}).\n\nOK: replace the saved copy with the file.\nCancel: keep both.`,
        )
          ? 'replace'
          : 'keep-both',
      { setuOrigin },
    )
    if (!result.ok) {
      onMessage(result.error, 'error')
      return
    }
    refresh()
    onMessage(result.message, 'ok')
    const [first] = result.saved
    if (first && result.saved.length === 1) navigate(reviewPath(first.kind, first.id))
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    let text: string
    try {
      text = await readFileText(file)
    } catch {
      onMessage('The file could not be read.', 'error')
      return
    }
    const parsed = parseImport(text)
    const reviews = reviewsToAsk(parsed)
    if (reviews.length) setAsking({ parsed, reviews })
    else finish(parsed, new Set())
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <Button onClick={() => fileRef.current?.click()}>{label}</Button>
      {asking && (
        <ProvenanceDialog
          reviews={asking.reviews}
          onDone={(setuOrigin) => {
            const { parsed } = asking
            setAsking(null)
            if (setuOrigin) finish(parsed, setuOrigin)
            else onMessage('Import cancelled. Nothing was changed.', 'ok')
          }}
        />
      )}
    </>
  )
}
