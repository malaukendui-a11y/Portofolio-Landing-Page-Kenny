/** `//  LABEL` section marker (DESIGN §3.2). The slashes are decorative. */
export function SectionLabel({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <p className={`font-mono text-label-sm uppercase text-accent-fg md:text-label ${className}`}>
      <span aria-hidden="true">{'//'}&nbsp;&nbsp;</span>
      {children}
    </p>
  )
}
