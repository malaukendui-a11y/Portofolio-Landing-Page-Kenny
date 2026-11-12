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
  /** Path under /public, e.g. /images/projects/pintukos-01-overview.webp */
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
  /**
   * True only for a repo verified public and ready to show (PRD §11). A public repo can stay
   * false on purpose (Trading Compass: README still the template), which hides the GitHub CTA.
   */
  repoPublic: boolean
  /** Thesis / plan PDF under /public, when available. */
  pdfUrl: string | null
  /** 3–6 tags. Empty until the owner provides the stack (PRD §12.2). */
  stack: readonly string[]
  /**
   * 2–4 screenshots, or design renders that say so in their alt text (shown as the lightbox
   * caption). The first is the card's cover. Empty until the owner provides them (PRD §12.1).
   */
  images: readonly ProjectImage[]
}

export const projects: readonly Project[] = [
  {
    id: 'pintukos',
    kind: 'product',
    // Live as a private family deployment behind a login: no public URL to link (PRD §6.1).
    status: 'live',
    year: '2026',
    liveUrl: null,
    repoUrl: 'https://github.com/malaukendui-a11y/Pengelola-Keuangan-Kos-Kontrakan-Kenny',
    // Owner decision: private while in beta.
    repoPublic: false,
    pdfUrl: null,
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vitest', 'Playwright'],
    // UI design renders with sample data, not production screenshots; each alt says so.
    images: [
      {
        src: '/images/projects/pintukos-01-overview.webp',
        width: 1600,
        height: 900,
        alt: {
          en: 'PintuKos overview: three phone screens of the boarding-house finance app — home with monthly profit, billing list, payment entry — design render, sample data',
          id: 'Ikhtisar PintuKos: tiga layar HP aplikasi keuangan kos — beranda dengan laba bulanan, daftar tagihan, catat pembayaran — render desain, data contoh',
        },
      },
      {
        src: '/images/projects/pintukos-02-payment-flow.webp',
        width: 1600,
        height: 900,
        alt: {
          en: 'Main flow: record rent in two steps — home, enter the payment, review before saving, the billing list updates — design render, sample data',
          id: 'Alur utama: catat uang sewa dalam dua langkah — beranda, isi pembayaran, periksa sebelum simpan, daftar tagihan ikut terbarui — render desain, data contoh',
        },
      },
      {
        src: '/images/projects/pintukos-03-owner-tools.webp',
        width: 1600,
        height: 900,
        alt: {
          en: 'Owner tools: properties and units, add a property with units in bulk, fill a unit, download the monthly PDF report — design render, sample data',
          id: 'Untuk pemilik: properti dan unit, tambah properti dengan unit massal, isi hunian, unduh laporan PDF bulanan — render desain, data contoh',
        },
      },
      {
        src: '/images/projects/pintukos-04-design-system.webp',
        width: 1600,
        height: 900,
        alt: {
          en: 'Design system: orange-and-white palette, DM Sans type, 44 px thumb-friendly controls, WCAG 2.2 AA contrast — design render, sample data',
          id: 'Sistem desain: palet oranye-putih, huruf DM Sans, kontrol 44 px ramah jari, kontras WCAG 2.2 AA — render desain, data contoh',
        },
      },
    ],
  },
  {
    id: 'trading-compass',
    kind: 'product',
    status: 'in-qa',
    year: '2026',
    liveUrl: null,
    repoUrl: 'https://github.com/malaukendui-a11y/Trading-Journal-X1',
    // Owner decision: no GitHub CTA while the project is paused and its README is still the
    // template (PRD §11), although the repo itself is public.
    repoPublic: false,
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
    status: 'in-development',
    year: '2026',
    liveUrl: null,
    repoUrl: null,
    repoPublic: false,
    pdfUrl: null,
    stack: ['Vite', 'React', 'TypeScript', 'Tailwind CSS'],
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

/**
 * Derives the CTA row for a card. Never hard-code buttons in components.
 * A `live` project without a public `liveUrl` (a private deployment, PRD §6.1 "Live (no public
 * URL)") previews its images in the lightbox instead, like `in-qa`.
 */
export function ctasFor(project: Project): ProjectCta[] {
  const ctas: ProjectCta[] = []
  const hasImages = project.images.length > 0

  switch (project.status) {
    case 'live':
      if (project.liveUrl) ctas.push({ kind: 'liveDemo', href: project.liveUrl, primary: true })
      else if (hasImages) ctas.push({ kind: 'preview', primary: true })
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
