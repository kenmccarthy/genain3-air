import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/fields'
import { reviewTitle } from '../../components/layout/labels'
import type { AnyReview } from '../../model/v2/schema'
import { SETU_INSTITUTION } from '../../store/provenance'

/**
 * Asks, for imported reviews with no institution name field, whether they were exported from
 * the SETU edition. Nothing is assumed: the default leaves Institution Name blank, and in a file
 * with several reviews each one is decided separately. Escape or Cancel stops the import.
 */
export function ProvenanceDialog({
  reviews,
  onDone,
}: {
  reviews: AnyReview[]
  /** The ids the user marked as from the SETU edition, or null to cancel the import. */
  onDone: (setuOrigin: Set<string> | null) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const single = reviews.length === 1

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const toggle = (id: string, on: boolean) =>
    setTicked((t) => {
      const next = new Set(t)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-slate-300 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
      onCancel={(e) => {
        e.preventDefault()
        onDone(null)
      }}
    >
      <div className="space-y-4 p-5">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          Institution name for {single ? 'this review' : 'these reviews'}
        </h2>
        <p className="text-sm text-slate-700">
          {single
            ? 'This file does not identify its originating edition. Was it exported from the SETU AI Integration Review?'
            : 'These reviews do not identify their originating edition. Tick any that were exported from the SETU AI Integration Review.'}
        </p>
        <p className="text-sm text-slate-600">
          If you are not sure, leave Institution Name blank. You can change it on each review’s
          context page at any time.
        </p>

        {single ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => onDone(new Set())} autoFocus>
              Leave Institution Name blank
            </Button>
            <Button onClick={() => onDone(new Set([reviews[0].id]))}>
              Set Institution Name to “{SETU_INSTITUTION}”
            </Button>
            <Button variant="ghost" onClick={() => onDone(null)}>
              Cancel import
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              onDone(ticked)
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-800">
                Set Institution Name to “{SETU_INSTITUTION}” for:
              </legend>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-start gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={ticked.has(r.id)}
                        onChange={(e) => toggle(r.id, e.target.checked)}
                      />
                      <span>
                        {reviewTitle(r)}{' '}
                        <span className="text-slate-500">
                          ({r.kind === 'programme' ? 'programme review' : 'module review'})
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTicked(new Set(reviews.map((r) => r.id)))}>Tick all</Button>
              <Button onClick={() => setTicked(new Set())}>Clear all</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" autoFocus>
                Import{ticked.size ? ` (${ticked.size} named)` : ' with Institution Name blank'}
              </Button>
              <Button variant="ghost" onClick={() => onDone(null)}>
                Cancel import
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
