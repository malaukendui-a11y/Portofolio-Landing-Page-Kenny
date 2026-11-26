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
  | 'gunadarma-go-lang-for-beginner'
  | 'gunadarma-desktop-programming'
  | 'gunadarma-javascript-fundamentals'
  | 'gunadarma-fundamental-web-programming'

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
  // The Gunadarma certificates are rendered from the owner's original e-certificate PDFs
  // (`-v2`, 1000 × 1415, v1.1 content), sharper than the photographs they replace.
  {
    id: 'gunadarma-designing-software',
    image: {
      src: '/images/certs/cert-gunadarma-designing-software-v2.webp',
      width: 1000,
      height: 1415,
    },
    issued: '2025-06',
    verifyUrl: null,
    certificateNo: '732921',
  },
  {
    id: 'gunadarma-go-lang-for-beginner',
    image: {
      src: '/images/certs/cert-gunadarma-go-lang-for-beginner-v2.webp',
      width: 1000,
      height: 1415,
    },
    issued: '2024-08',
    verifyUrl: null,
    certificateNo: '596767',
  },
  {
    id: 'gunadarma-desktop-programming',
    image: {
      src: '/images/certs/cert-gunadarma-desktop-programming-v2.webp',
      width: 1000,
      height: 1415,
    },
    issued: '2024-02',
    verifyUrl: null,
    certificateNo: '184344',
  },
  {
    id: 'gunadarma-javascript-fundamentals',
    image: {
      src: '/images/certs/cert-gunadarma-javascript-fundamentals-v2.webp',
      width: 1000,
      height: 1415,
    },
    issued: '2023-11',
    verifyUrl: null,
    certificateNo: '213780',
  },
  {
    id: 'gunadarma-fundamental-web-programming',
    image: {
      src: '/images/certs/cert-gunadarma-fundamental-web-programming-v2.webp',
      width: 1000,
      height: 1415,
    },
    issued: '2022-02',
    verifyUrl: null,
    certificateNo: '852172',
  },
]

/** Newest first. */
export const certifications: readonly Certification[] = [...list].sort((a, b) =>
  b.issued.localeCompare(a.issued),
)
