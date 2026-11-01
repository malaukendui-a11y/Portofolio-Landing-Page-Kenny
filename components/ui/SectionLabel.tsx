/**
 * `//  LABEL` section marker (DESIGN §3.2). The slashes are decorative. Labels reveal
 * once on enter (MotionRoot); the hero's scroll cue opts out, it is on screen at load.
 */
export function SectionLabel({
  children,
  className = '',
  reveal = true,
}: {
  children: string
  className?: string
  reveal?: boolean
}) {
  return (
    <p
      data-reveal={reveal || undefined}
      className={`font-mono text-label-sm uppercase text-accent-fg md:text-label ${className}`}
    >
      <span aria-hidden="true">{'//'}&nbsp;&nbsp;</span>
      {children}
    </p>
  )
}
