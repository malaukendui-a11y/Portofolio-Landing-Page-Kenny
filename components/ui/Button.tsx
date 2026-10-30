import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'filled' | 'outlined' | 'accent'

// Every variant keeps a 1 px border so the pill does not change size when it inverts;
// a trailing arrow icon slides 4 px toward where it points.
const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border px-6 font-medium text-body transition-colors duration-fast ease-out [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-fast [&_[data-arrow]]:ease-out hover:[&_[data-arrow]]:translate-x-0.75 hover:[&_[data-arrow]]:-translate-y-0.75'

/**
 * DESIGN §5 (v1.1): filled = ink on paper / light on dark and outlined invert on hover over
 * dur-fast; accent = terracotta pill on dark with an accent-600 fill (text-on-dark reaches
 * 5.8:1) that lightens to accent-500 on hover.
 */
const variants: Record<Variant, string> = {
  filled: 'border-fg bg-fg text-surface hover:bg-transparent hover:text-fg',
  outlined: 'border-fg text-fg hover:bg-fg hover:text-surface',
  accent: 'border-transparent bg-accent-600 text-text-on-dark hover:bg-accent-500',
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
