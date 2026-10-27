/**
 * QA Evidence artifacts — PRD §5 (#6), DESIGN §4.6. Language-neutral data;
 * titles and captions live in content/en.ts and content/id.ts under
 * `qa.artifacts`, keyed by QaArtifactId.
 *
 * Empty until the owner provides the Trading Compass documents (PRD §12.7);
 * the section hides the artifact grid while this list is empty.
 */

export type QaArtifactId = 'test-plan' | 'test-cases' | 'bug-report'

export interface QaArtifact {
  id: QaArtifactId
  image: {
    /** Path under /public/images/qa */
    src: string
    width: number
    height: number
  }
}

export const qaArtifacts: readonly QaArtifact[] = []
