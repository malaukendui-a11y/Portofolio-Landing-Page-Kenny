/**
 * Language state — PRD F-02. English default, Indonesian via toggle, persisted
 * in localStorage, no route change. Implemented as an external store so the
 * server render is always EN and the client re-syncs without a hydration error.
 */
import { useSyncExternalStore } from 'react'
import en from '@/content/en'
import id from '@/content/id'
import { site } from '@/content/site'
import type { Copy, Lang } from '@/content/types'

export const LANG_STORAGE_KEY = 'lang'
export const LANGS: readonly Lang[] = ['en', 'id']
export const copy: Record<Lang, Copy> = { en, id }

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'id'
}

const listeners = new Set<() => void>()
/** In-memory fallback so the toggle still works when storage is blocked. */
let memoryLang: Lang | null = null

function readStored(): Lang | null {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY)
    return isLang(stored) ? stored : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSnapshot(): Lang {
  return memoryLang ?? readStored() ?? site.defaultLang
}

function getServerSnapshot(): Lang {
  return site.defaultLang
}

export function setLang(next: Lang): void {
  memoryLang = next
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next)
  } catch {
    // Storage unavailable: memoryLang keeps the choice for this page view.
  }
  listeners.forEach((listener) => listener())
}

/** Current language and its copy. Safe in any client component. */
export function useLang(): { lang: Lang; t: Copy; setLang: (next: Lang) => void } {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { lang, t: copy[lang], setLang }
}

/** "Oct 2026" / "Okt 2026" from a YYYY-MM string (PRD F-11). */
export function formatMonth(yearMonth: string, lang: Lang): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}
