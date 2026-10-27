import type { ReactNode } from 'react'

type Surface = 'dark' | 'paper'

/** Full-bleed section with DESIGN §3.3 padding and a surface context. */
export function Section({
  id,
  surface,
  children,
  className = '',
  labelledBy,
}: {
  id: string
  surface: Surface
  children: ReactNode
  className?: string
  labelledBy?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${surface === 'dark' ? 'surface-dark' : 'surface-paper'} px-gutter-sm py-section-sm md:px-gutter-md md:py-section-md lg:px-gutter lg:py-section ${className}`}
    >
      {children}
    </section>
  )
}
