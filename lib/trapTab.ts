const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Wraps Tab / Shift+Tab inside a container (DESIGN §9: lightbox and mobile menu
 * trap focus). A modal <dialog> already keeps focus off the page, but browsers let
 * Tab leave the last control for their own chrome; this keeps it cycling.
 */
export function trapTab(
  event: { key: string; shiftKey: boolean; preventDefault: () => void },
  container: HTMLElement | null,
): void {
  if (event.key !== 'Tab' || !container) return
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null,
  )
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  const inside = active instanceof HTMLElement && container.contains(active)
  if (event.shiftKey && (active === first || !inside)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !inside)) {
    event.preventDefault()
    first.focus()
  }
}
