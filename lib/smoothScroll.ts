/**
 * Lenis smooth scroll (PRD F-01) driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one frame loop. Created only when motion is allowed (MotionRoot); under
 * reduced motion there is no instance and every helper here falls back to native
 * scrolling.
 */
import Lenis from 'lenis'
import { DUR, EASE, gsap, ScrollTrigger } from './motion'

let lenis: Lenis | null = null

function tick(time: number): void {
  lenis?.raf(time * 1000)
}

export function getLenis(): Lenis | null {
  return lenis
}

export function startSmoothScroll(): void {
  if (lenis) return
  // autoResize: a ResizeObserver on <html> re-measures the page when it grows (late
  // images, font swap). It sees the growth because lenis.css gives `html.lenis` height
  // auto, overriding the layout's `h-full`; tests/playwright/motion.spec.ts covers it.
  lenis = new Lenis({ autoRaf: false, autoResize: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  // Lenis owns the timing; GSAP's lag smoothing would make the two drift apart.
  gsap.ticker.lagSmoothing(0)
}

export function stopSmoothScroll(): void {
  if (!lenis) return
  gsap.ticker.remove(tick)
  gsap.ticker.lagSmoothing(500, 33)
  lenis.destroy()
  lenis = null
}

/** Moves keyboard focus to the target without scrolling, as a native anchor jump would. */
function focusTarget(target: HTMLElement): void {
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1')
    target.setAttribute('data-focus-target', '')
  }
  target.focus({ preventScroll: true })
}

/** True once the destination sits at the viewport top, or the page cannot scroll further. */
function isAt(destination: HTMLElement | 0): boolean {
  if (destination === 0) return window.scrollY <= 1
  const top = destination.getBoundingClientRect().top
  const bottom = document.documentElement.scrollHeight - window.innerHeight
  return Math.abs(top) <= 1 || (top > 0 && window.scrollY >= bottom - 1)
}

/**
 * In-page navigation for `#id` links (nav, mobile menu, footer, back-to-top): Lenis
 * eases to the section, the URL gains the hash and focus lands in the section.
 * Without Lenis it is a plain native anchor jump.
 */
export function scrollToHash(hash: string): void {
  const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null
  if (!target) return
  if (!lenis) {
    window.location.assign(hash)
    return
  }
  // A scroll lock (menu, lightbox) has been released by the caller; make sure Lenis is too.
  if (lenis.isStopped) lenis.start()
  // Lenis hears about a native jump (find-in-page, scrollbar) one frame late; sync it to
  // the real position first so the target is measured from where the page actually is.
  if (lenis.isScrolling !== 'smooth') lenis.scrollTo(lenis.actualScroll, { immediate: true })
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)
  focusTarget(target)
  // `#top` (brand, back-to-top) means the page top, above the in-flow sticky header.
  const destination = hash === '#top' ? 0 : target
  lenis.scrollTo(destination, { duration: DUR.slow, easing: gsap.parseEase(EASE.expo) })
  // Safety net: under heavy load Lenis has been seen to drop the scroll without moving
  // (cause not found yet). If it is not scrolling by the next frame, jump natively so a
  // link never does nothing, then sync Lenis to where the page now is (left to its native
  // scroll handling, it can stay flagged as scrolling).
  requestAnimationFrame(() => {
    if (!lenis || lenis.isScrolling === 'smooth' || isAt(destination)) return
    ;(destination === 0 ? document.documentElement : destination).scrollIntoView()
    lenis.scrollTo(lenis.actualScroll, { immediate: true })
  })
}
