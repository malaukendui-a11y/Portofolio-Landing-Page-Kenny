'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/** DESIGN §5: a toast stays 2.5 s. */
const TOAST_MS = 2500

/**
 * Toast (DESIGN §5): bottom-centre, 2.5 s, a polite live region that is always
 * mounted so screen readers announce the message. It only fires from Reach Out
 * (a paper surface), so the chip is the inverse: ink-900 with text-on-dark.
 */
function Toast({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-gutter-sm"
    >
      <p
        className={`rounded-pill border border-ink-700 bg-ink-900 px-5 py-3 font-mono text-meta text-text-on-dark transition-opacity duration-fast ease-out ${
          message ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {message ?? ''}
      </p>
    </div>
  )
}

/** `const { show, toast } = useToast()` — render `{toast}` once, call `show(text)`. */
export function useToast(): { show: (message: string) => void; toast: ReactNode } {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((next: string) => {
    window.clearTimeout(timer.current)
    setMessage(next)
    timer.current = window.setTimeout(() => setMessage(null), TOAST_MS)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { show, toast: <Toast message={message} /> }
}
