import type { ReactNode } from 'react'

type Variant = 'filled' | 'outlined' | 'accent'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 font-medium text-body transition-colors duration-fast ease-out'

/** DESIGN §5: filled = ink on paper / light on dark; accent = accent-500 (dark surfaces only). */
const variants: Record<Variant, string> = {
  filled: 'bg-fg text-surface hover:bg-accent-fg',
  outlined: 'border border-current text-fg hover:bg-fg hover:text-surface',
  accent: 'bg-accent-500 text-text-on-dark hover:bg-accent-400',
}

/** Pill button rendered as a link (DESIGN §5). External links get the safe rel. */
export function ButtonLink({
  href,
  variant = 'filled',
  external = false,
  download = false,
  children,
  className = '',
}: {
  href: string
  variant?: Variant
  external?: boolean
  download?: boolean
  children: ReactNode
  className?: string
}) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a
      href={href}
      {...externalProps}
      download={download || undefined}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </a>
  )
}
