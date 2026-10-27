/**
 * Project inventory — PRD §6.2. Language-neutral data only; titles,
 * descriptions and roles live in content/en.ts and content/id.ts under
 * `projects.items`, keyed by ProjectId so a missing translation is a type error.
 *
 * CTA rules (PRD §6.1, CLAUDE.md rule 2) are implemented once in `ctasFor`.
 */

export type ProjectId =
  'pintukos' | 'trading-compass' | 'malau-website' | 'kos-kontrakan-landing' | 'crypto-research'

export type ProjectStatus =
  'live' | 'in-qa' | 'in-development' | 'in-design' | 'planned' | 'completed'

export interface ProjectImage {
  /** Path under /public, e.g. /images/projects/pintukos-01.webp */
  src: string
  width: number
  height: number
  alt: { en: string; id: string }
}

export interface Project {
  id: ProjectId
  kind: 'product' | 'research'
  status: ProjectStatus
  year: string
  liveUrl: string | null
  repoUrl: string | null
  /** Only true once the repo is verified public (PRD §11). */
  repoPublic: boolean
  /** Thesis / plan PDF under /public, when available. */
  pdfUrl: string | null
  /** 3–6 tags. Empty until the owner provides the stack (PRD §12.2). */
  stack: readonly string[]
  /** 2–4 screenshots. Empty until the owner provides them (PRD §12.1). */
  images: readonly ProjectImage[]
}

export const projects: readonly Project[] = [
  {
    id: 'pintukos',
    kind: 'product',
    status: 'in-development',
    year: '2026',
    liveUrl: null,
    repoUrl: 'https://github.com/malaukendui-a11y/Pengelola-Keuangan-Kos-Kontrakan-Kenny',
    repoPublic: false,
    pdfUrl: null,
    stack: [],
    images: [],
  },
  {
    id: 'trading-compass',
    kind: 'product',
    status: 'in-qa',
    year: '2026',
    liveUrl: null,
    repoUrl: 'https://github.com/malaukendui-a11y/Trading-Journal-X1',
    repoPublic: true,
    pdfUrl: null,
    stack: ['React', 'Vite', 'Supabase'],
    images: [],
  },
  {
    id: 'malau-website',
    kind: 'product',
    status: 'in-design',
    year: '2026',
    liveUrl: null,
    repoUrl: 'https://github.com/malaukendui-a11y/malau-website',
    repoPublic: false,
    pdfUrl: null,
    stack: [],
    images: [],
  },
  {
    id: 'kos-kontrakan-landing',
    kind: 'product',
    status: 'planned',
    year: '2026',
    liveUrl: null,
    repoUrl: null,
    repoPublic: false,
    pdfUrl: null,
    stack: [],
    images: [],
  },
  {
    id: 'crypto-research',
    kind: 'research',
    status: 'completed',
    year: '2025',
    liveUrl: null,
    repoUrl: null,
    repoPublic: false,
    pdfUrl: '/papers/big-data-altcoin-analysis-2025.pdf',
    stack: ['Big data', 'Time-series analysis', 'Cryptocurrency markets'],
    images: [],
  },
]

export type CtaKind =
  'liveDemo' | 'github' | 'preview' | 'previewDesigns' | 'readPlan' | 'readPaper'

export interface ProjectCta {
  kind: CtaKind
  /** External href for links; undefined for in-page actions (lightbox). */
  href?: string
  primary: boolean
}

/** Derives the CTA row for a card. Never hard-code buttons in components. */
export function ctasFor(project: Project): ProjectCta[] {
  const ctas: ProjectCta[] = []
  const hasImages = project.images.length > 0

  switch (project.status) {
    case 'live':
      if (project.liveUrl) ctas.push({ kind: 'liveDemo', href: project.liveUrl, primary: true })
      break
    case 'in-qa':
    case 'in-development':
      if (hasImages) ctas.push({ kind: 'preview', primary: true })
      break
    case 'in-design':
      if (hasImages) ctas.push({ kind: 'previewDesigns', primary: true })
      break
    case 'planned':
      if (project.pdfUrl) ctas.push({ kind: 'readPlan', href: project.pdfUrl, primary: true })
      break
    case 'completed':
      if (project.pdfUrl) ctas.push({ kind: 'readPaper', href: project.pdfUrl, primary: true })
      break
  }

  const githubAllowed = project.status !== 'in-design' && project.status !== 'planned'
  if (githubAllowed && project.repoUrl && project.repoPublic) {
    ctas.push({ kind: 'github', href: project.repoUrl, primary: ctas.length === 0 })
  }

  return ctas
}
