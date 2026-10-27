/**
 * Certificates — PRD §5 (#8), DESIGN §4.8. Language-neutral data only; title,
 * issuer, period and scope live in content/en.ts and content/id.ts under
 * `certifications.items`, keyed by CertificationId (same pattern as projects).
 *
 * Open list: add an entry here plus its copy in both languages. The list is
 * sorted newest first by `issued` at module load, so order here does not matter.
 */

export type CertificationId =
  | 'revou-intro-software-engineering'
  | 'gunadarma-designing-software'
  | 'gunadarma-desktop-programming'
  | 'gunadarma-javascript-fundamentals'

export interface CertificationImage {
  /** Path under /public/images/certs */
  src: string
  width: number
  height: number
}

export interface Certification {
  id: CertificationId
  image: CertificationImage
  /** YYYY-MM */
  issued: string
  /** Public verification page, when the issuer offers one. */
  verifyUrl: string | null
  /** Printed certificate number, shown when there is no verify link. */
  certificateNo: string | null
}

const list: readonly Certification[] = [
  {
    id: 'revou-intro-software-engineering',
    image: {
      src: '/images/certs/cert-revou-intro-software-engineering.webp',
      width: 1600,
      height: 1134,
    },
    issued: '2026-09',
    verifyUrl: null,
    certificateNo: 'CCSE-210926-01-1-00047',
  },
  {
    id: 'gunadarma-designing-software',
    image: { src: '/images/certs/cert-gunadarma-designing-software.webp', width: 700, height: 976 },
    issued: '2025-06',
    verifyUrl: null,
    certificateNo: '732921',
  },
  {
    id: 'gunadarma-desktop-programming',
    image: {
      src: '/images/certs/cert-gunadarma-desktop-programming.webp',
      width: 662,
      height: 931,
    },
    issued: '2024-02',
    verifyUrl: null,
    certificateNo: '184344',
  },
  {
    id: 'gunadarma-javascript-fundamentals',
    image: {
      src: '/images/certs/cert-gunadarma-javascript-fundamentals.webp',
      width: 657,
      height: 932,
    },
    issued: '2023-11',
    verifyUrl: null,
    certificateNo: '213780',
  },
]

/** Newest first. */
export const certifications: readonly Certification[] = [...list].sort((a, b) =>
  b.issued.localeCompare(a.issued),
)
