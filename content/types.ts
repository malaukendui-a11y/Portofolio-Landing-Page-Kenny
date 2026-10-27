/**
 * Shape shared by content/en.ts and content/id.ts (CLAUDE.md rule 1).
 * A key missing in one language is a type error.
 */
import type { CtaKind, ProjectId, ProjectStatus } from './projects'

export type Lang = 'en' | 'id'

/** A run of text inside a statement; `accent` marks the highlighted phrase. */
export interface StatementPart {
  text: string
  accent?: boolean
}

export interface ServiceCard {
  index: string
  title: string
  description: string
  items: readonly string[]
}

export interface ProjectCopy {
  title: string
  description: string
  role: string
}

export interface TimelineEntry {
  /** Empty string = not yet confirmed by the owner (PRD §12.6); hidden when empty. */
  period: string
  title: string
  org: string
  location: string
  description: string
  bullets: readonly string[]
}

export interface Certification {
  title: string
  issuer: string
  period: string
  scope: string
}

export interface QaArtifact {
  title: string
  caption: string
}

export interface Copy {
  meta: {
    title: string
    description: string
  }
  nav: {
    brand: string
    work: string
    about: string
    contact: string
    downloadCv: string
    skipToContent: string
    language: string
    menu: string
  }
  hero: {
    name: string
    roles: readonly [string, string]
    availability: string
    socials: { linkedin: string; github: string; whatsapp: string }
    scrollCue: string
  }
  intro: {
    label: string
    statement: readonly StatementPart[]
    paragraph: string
    seeWork: string
    downloadCv: string
  }
  services: {
    label: string
    heading: string
    cards: readonly [ServiceCard, ServiceCard, ServiceCard]
  }
  projects: {
    label: string
    heading: string
    roleLabel: string
    stackLabel: string
    status: Record<ProjectStatus, string>
    cta: Record<CtaKind, string>
    items: Record<ProjectId, ProjectCopy>
  }
  qa: {
    label: string
    heading: string
    statement: string
    paragraph: string
    artifacts: readonly [QaArtifact, QaArtifact, QaArtifact]
  }
  experience: {
    label: string
    heading: string
    educationHeading: string
    work: TimelineEntry
    education: TimelineEntry
  }
  certifications: {
    label: string
    heading: string
    items: readonly [Certification, Certification, Certification]
  }
  reachOut: {
    label: string
    ticker: string
    heading: string
    intro: string
    email: { label: string; copy: string; copied: string }
    whatsapp: { label: string; prefill: string }
    location: { label: string; value: string }
    availability: string
    ctas: { email: string; whatsapp: string }
    socialsLabel: string
    backToTop: string
  }
  footer: {
    /** `{year}` is replaced at render time. */
    copyright: string
    builtWith: string
    languageNote: string
  }
}
