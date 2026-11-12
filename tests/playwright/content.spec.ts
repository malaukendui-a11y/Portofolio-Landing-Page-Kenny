// M4b content (PRD §6, §12): TC-088 (status → CTA matrix for `ctasFor`).
import { expect, test } from './fixtures'
import { ctasFor, type Project, type ProjectImage } from '../../content/projects'

const base: Project = {
  id: 'pintukos',
  kind: 'product',
  status: 'live',
  year: '2026',
  liveUrl: null,
  repoUrl: null,
  repoPublic: false,
  pdfUrl: null,
  stack: [],
  images: [],
}
const image: ProjectImage = { src: '/x.webp', width: 1600, height: 900, alt: { en: 'x', id: 'x' } }

// TC-088: PRD §6.1 / CLAUDE.md rule 2 as data, without a browser. A live project without a
// public URL previews its images; one with a URL links the demo; GitHub only for a public repo.
test('ctasFor: a live project without a public URL previews its images', () => {
  test.skip(test.info().project.name !== 'desktop', 'no browser involved')
  expect(ctasFor({ ...base, images: [image] })).toEqual([{ kind: 'preview', primary: true }])
  expect(ctasFor(base)).toEqual([])
  expect(ctasFor({ ...base, liveUrl: 'https://example.test', images: [image] })).toEqual([
    { kind: 'liveDemo', href: 'https://example.test', primary: true },
  ])
  expect(
    ctasFor({ ...base, images: [image], repoUrl: 'https://github.com/a/b', repoPublic: true }),
  ).toEqual([
    { kind: 'preview', primary: true },
    { kind: 'github', href: 'https://github.com/a/b', primary: false },
  ])
  // A known but private repo never shows.
  expect(ctasFor({ ...base, images: [image], repoUrl: 'https://github.com/a/b' })).toEqual([
    { kind: 'preview', primary: true },
  ])
})
