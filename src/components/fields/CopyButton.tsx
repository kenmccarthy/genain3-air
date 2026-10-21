import { useState } from 'react'
import { Button } from './Section'

/**
 * Copies text to the clipboard and says whether it worked. Some browsers refuse clipboard access
 * (for example without HTTPS or permission); the user is then told to select and copy instead.
 */
export function CopyButton({ label, text }: { label: string; text: () => string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text())
      setState('copied')
    } catch {
      setState('failed')
    }
  }
  return (
    <>
      <Button onClick={() => void copy()}>{state === 'copied' ? 'Copied' : label}</Button>
      <span role="status" className={state === 'failed' ? 'text-sm text-rose-800' : 'sr-only'}>
        {state === 'copied' && 'Copied to the clipboard.'}
        {state === 'failed' &&
          'This browser did not allow copying. Use Print / save as PDF, or select the text and copy it.'}
      </span>
    </>
  )
}
