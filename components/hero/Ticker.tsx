/**
 * Oversized single-line ticker (DESIGN §3.2 `display-ticker`, §4.2 / §4.9).
 * M1: static and clipped — the text is repeated so it fills any width and the
 * middle copy is centred in the viewport; the marquee motion arrives in M2 and
 * the WebGL version in M3. Decorative: the real heading is the visually-hidden
 * <h1> / <h2> beside it.
 */
export function Ticker({
  text,
  repeat = 3,
  className = '',
}: {
  text: string
  repeat?: number
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden font-display text-ticker whitespace-nowrap text-fg select-none ${className}`}
    >
      <span className="relative left-1/2 inline-block -translate-x-1/2">
        {Array.from({ length: repeat }, () => text).join('  —  ')}
      </span>
    </div>
  )
}
