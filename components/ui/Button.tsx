import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'filled' | 'outlined' | 'accent'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 font-medium text-body transition-colors duration-fast ease-out'

/**
 * DESIGN §5 (v1.1): filled = ink on paper / light on dark; accent = terracotta pill on dark
 * with an accent-600 fill (text-on-dark reaches 5.8:1) and accent-500 on hover.
 */
const variants: Record<Variant, string> = {
  filled: 'bg-fg text-surface hover:bg-accent-fg',
  outlined: 'border border-current text-fg hover:bg-fg hover:text-surface',
  accent: 'bg-accent-600 text-text-on-dark hover:bg-accent-500',
}

export function buttonClasses(variant: Variant = 'filled', className = ''): string {
  return `${base} ${variants[variant]} ${className}`
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
      className={buttonClasses(variant, className)}
    >
      {children}
    </a>
  )
}

/** Pill button rendered as a real <button> for in-page actions (lightbox, copy). */
export function Button({
  variant = 'filled',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...rest}>
      {children}
    </button>
  )
}
