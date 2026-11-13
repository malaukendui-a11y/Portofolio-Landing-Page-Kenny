/**
 * QA Evidence artifacts — PRD §5 (#6), §12.7, DESIGN §4.6. Language-neutral data;
 * titles and captions live in content/en.ts and content/id.ts under
 * `qa.artifacts`, keyed by QaArtifactId.
 *
 * Three screenshots from the owner's PintuKos repository, sample data only (M4b batch 2): the
 * green GitHub Actions run, the Playwright report and the UAT sheet. The section still hides the
 * grid if this list is ever empty: no placeholders.
 */

export type QaArtifactId = 'ci-run' | 'e2e-report' | 'uat-sheet'

export interface QaArtifact {
  id: QaArtifactId
  image: {
    /** Path under /public/images/qa */
    src: string
    width: number
    height: number
  }
}

export const qaArtifacts: readonly QaArtifact[] = [
  {
    id: 'ci-run',
    image: { src: '/images/qa/pintukos-ci-run.webp', width: 1507, height: 781 },
  },
  {
    id: 'e2e-report',
    image: { src: '/images/qa/pintukos-e2e-report.webp', width: 1026, height: 821 },
  },
  {
    id: 'uat-sheet',
    image: { src: '/images/qa/pintukos-uat-sheet.webp', width: 1640, height: 1240 },
  },
]
