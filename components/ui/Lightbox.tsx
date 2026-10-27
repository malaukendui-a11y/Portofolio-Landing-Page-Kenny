'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useLang } from '@/lib/i18n'
import { useRestoreFocus } from '@/lib/useRestoreFocus'
import { useScrollLock } from '@/lib/useScrollLock'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons'

export interface LightboxItem {
  src: string
  width: number
  height: number
  alt: string
  caption?: string
}

interface LightboxState {
  items: readonly LightboxItem[]
  index: number
}

const controlClasses =
  'inline-flex size-12 items-center justify-center rounded-pill border border-ink-700 bg-ink-900/80 text-text-on-dark transition-colors duration-fast ease-out hover:bg-ink-700'

/**
 * Lightbox (PRD F-08, DESIGN §5): a native <dialog> opened with showModal(), which
 * gives focus containment, Esc-to-close and an inert page for free. Arrow keys move
 * between items, body scroll is locked and focus returns to the trigger on close.
 */
function Lightbox({
  state,
  onIndexChange,
  onClosed,
}: {
  state: LightboxState | null
  onIndexChange: (index: number) => void
  onClosed: () => void
}) {
  const { t } = useLang()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = state !== null
  useScrollLock(open)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open || dialog.open) return
    dialog.showModal()
    closeRef.current?.focus()
  }, [open])

  const total = state?.items.length ?? 0
  const item = state ? state.items[state.index] : null

  const step = (delta: number) => {
    if (!state || total < 2) return
    onIndexChange((state.index + delta + total) % total)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={t.lightbox.label}
      onClose={onClosed}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself, not its children) closes.
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-text-on-dark backdrop:bg-ink-900/95"
    >
      {item && state && (
        <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center px-gutter-sm md:px-gutter-md lg:px-gutter">
          <figure className="pointer-events-auto flex max-h-[85vh] max-w-[90vw] flex-col items-center">
            <Image
              key={item.src}
              src={item.src}
              width={item.width}
              height={item.height}
              alt={item.alt}
              sizes="90vw"
              className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-lightbox object-contain shadow-lightbox"
            />
            <figcaption className="mt-4 flex w-full items-center justify-between gap-6 font-mono text-meta-sm md:text-meta">
              <span>{item.caption ?? item.alt}</span>
              {total > 1 && (
                <span className="text-muted-on-dark">
                  {t.lightbox.counter
                    .replace('{current}', String(state.index + 1))
                    .replace('{total}', String(total))}
                </span>
              )}
            </figcaption>
          </figure>

          <button
            ref={closeRef}
            type="button"
            aria-label={t.lightbox.close}
            onClick={() => dialogRef.current?.close()}
            className={`${controlClasses} pointer-events-auto absolute top-4 right-4 md:top-6 md:right-6`}
          >
            <XIcon />
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                aria-label={t.lightbox.previous}
                onClick={() => step(-1)}
                className={`${controlClasses} pointer-events-auto absolute top-1/2 left-4 -translate-y-1/2 md:left-6`}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                aria-label={t.lightbox.next}
                onClick={() => step(1)}
                className={`${controlClasses} pointer-events-auto absolute top-1/2 right-4 -translate-y-1/2 md:right-6`}
              >
                <ChevronRightIcon />
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}

/**
 * `const { open, lightbox } = useLightbox()` — render `{lightbox}` once in the
 * section and call `open(items, index)` from any trigger button.
 */
export function useLightbox(): {
  open: (items: readonly LightboxItem[], index?: number) => void
  lightbox: ReactNode
} {
  const [state, setState] = useState<LightboxState | null>(null)
  const focus = useRestoreFocus()

  const open = useCallback(
    (items: readonly LightboxItem[], index = 0) => {
      if (items.length === 0) return
      focus.remember()
      setState({ items, index })
    },
    [focus],
  )

  const onIndexChange = useCallback((index: number) => {
    setState((current) => (current ? { ...current, index } : current))
  }, [])

  const onClosed = useCallback(() => {
    setState(null)
    focus.restore()
  }, [focus])

  const lightbox = <Lightbox state={state} onIndexChange={onIndexChange} onClosed={onClosed} />
  return { open, lightbox }
}
