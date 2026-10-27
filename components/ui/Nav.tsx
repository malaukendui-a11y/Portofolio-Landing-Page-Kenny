'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { site } from '@/content/site'
import { useLang } from '@/lib/i18n'
import { useRestoreFocus } from '@/lib/useRestoreFocus'
import { useScrollLock } from '@/lib/useScrollLock'
import { ButtonLink } from './Button'
import { LangToggle } from './LangToggle'
import { MenuIcon, XIcon } from './icons'

/**
 * Sticky navigation (DESIGN §4.1): transparent over the hero, ink-900/80 + blur once
 * the page has scrolled past the 80 px sentinel (IntersectionObserver, no scroll
 * listener). Mobile: brand + hamburger opening a full-screen ink-900 <dialog> with
 * the same links, the language toggle and the CV button (hidden while cvUrl is null).
 */
export function Nav() {
  const { t } = useLang()
  const links = [
    { href: '#work', label: t.nav.work },
    { href: '#about', label: t.nav.about },
    { href: '#contact', label: t.nav.contact },
  ]

  // Scroll backdrop
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Mobile menu
  const menuRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const pendingHash = useRef<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const focus = useRestoreFocus()
  useScrollLock(menuOpen)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu || !menuOpen || menu.open) return
    menu.showModal()
    closeRef.current?.focus()
  }, [menuOpen])

  const openMenu = () => {
    focus.remember()
    setMenuOpen(true)
  }

  const onMenuClosed = useCallback(() => {
    setMenuOpen(false)
    focus.restore()
    const hash = pendingHash.current
    pendingHash.current = null
    // Navigate after the scroll lock is released by the re-render.
    if (hash) requestAnimationFrame(() => window.location.assign(hash))
  }, [focus])

  const onMenuLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault()
    pendingHash.current = href
    menuRef.current?.close()
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 left-0 h-20 w-px" />
      <header
        className={`sticky top-0 z-40 px-gutter-sm py-4 transition-[background-color,color] duration-fast ease-out md:px-gutter-md lg:px-gutter ${
          scrolled ? 'surface-dark-glass' : 'bg-transparent'
        }`}
      >
        <nav
          aria-label={t.nav.menu}
          className="grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]"
        >
          <a href="#top" className="text-body-lg text-fg">
            {t.nav.brand}
          </a>
          <ul className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-body text-fg transition-colors duration-fast ease-out hover:text-accent-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden items-center justify-end gap-6 md:flex">
            <LangToggle />
            {site.cvUrl && (
              <ButtonLink href={site.cvUrl} download>
                {t.nav.downloadCv}
              </ButtonLink>
            )}
          </div>
          <button
            type="button"
            aria-label={t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={openMenu}
            className="inline-flex size-11 items-center justify-center rounded-pill text-fg md:hidden"
          >
            <MenuIcon size={24} />
          </button>
        </nav>
      </header>

      <dialog
        id="mobile-menu"
        ref={menuRef}
        aria-label={t.nav.menu}
        onClose={onMenuClosed}
        className="surface-dark fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-ink-900"
      >
        {menuOpen && (
          <div className="flex h-full flex-col px-gutter-sm py-4">
            <div className="flex items-center justify-between">
              <span className="text-body-lg text-fg">{t.nav.brand}</span>
              <button
                ref={closeRef}
                type="button"
                aria-label={t.nav.closeMenu}
                onClick={() => menuRef.current?.close()}
                className="inline-flex size-11 items-center justify-center rounded-pill text-fg"
              >
                <XIcon size={24} />
              </button>
            </div>
            <ul className="mt-16 flex flex-col gap-6">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(event) => onMenuLinkClick(event, link.href)}
                    className="inline-block min-h-11 font-display text-statement-sm text-fg hover:text-accent-fg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-6 border-t border-hairline pt-6">
              <LangToggle />
              {site.cvUrl && (
                <ButtonLink href={site.cvUrl} download className="self-start">
                  {t.nav.downloadCv}
                </ButtonLink>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
