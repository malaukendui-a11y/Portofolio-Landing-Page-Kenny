/** English copy (default language). Source: PRD §5, Appendix A, DESIGN §4. */
import type { Copy } from './types'

const en = {
  meta: {
    title: 'Ananda Kenny — Junior QA & Software Engineer',
    description:
      'Portfolio of Ananda Kenny, a junior QA and software engineer in East Jakarta, Indonesia. Web products built with AI and tested like a user would.',
    og: {
      label: 'Portfolio',
      alt: 'Portfolio card: “Ananda Kenny” in large type on warm paper, with the roles Junior QA Engineer and Junior Software Engineer',
    },
  },
  nav: {
    brand: '© Ananda Kenny',
    work: 'Work',
    about: 'About',
    contact: 'Contact',
    downloadCv: 'Download CV',
    skipToContent: 'Skip to content',
    language: 'Language',
    menu: 'Menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  hero: {
    name: 'Ananda Kenny',
    roles: ['Junior QA Engineer', 'Junior Software Engineer'],
    availability: 'Open to work',
    socials: { linkedin: 'LinkedIn', github: 'GitHub', whatsapp: 'WhatsApp' },
    scrollCue: 'Intro',
    portraitAlt: 'Ananda Kenny in a dark suit and tie, looking at the camera',
  },
  intro: {
    label: 'Intro',
    statement: [
      { text: 'I’m an Information Systems graduate ' },
      { text: 'learning software engineering', accent: true },
      { text: ' — I build with AI and ' },
      { text: 'test everything like a user would', accent: true },
      { text: '.' },
    ],
    paragraph:
      'Bachelor of Information Systems, Universitas Gunadarma (GPA 3.43, January 2026), and QA Tester on Kopra by Mandiri. I build real products with AI agents such as Claude Code and Codex, then review and test every change. PintuKos has 2,000+ unit tests; this site runs 600+ automated tests on every pull request.',
    seeWork: 'See my work',
    downloadCv: 'Download CV (Indonesian)',
  },
  services: {
    label: 'What I do',
    heading: 'What I do',
    cards: [
      {
        index: '01',
        title: 'Quality Assurance & Testing',
        description:
          'Manual and user-acceptance testing that catches what automated checks miss, documented so the team can act on it.',
        items: [
          'Manual & UAT testing with regression cycles',
          'Test scenario & test case design',
          'Regression planning and execution reporting',
          'Bug reporting and defect lifecycle in Jira',
          'Exploratory testing',
          'Automated tests with Playwright and Vitest in my own projects',
        ],
      },
      {
        index: '02',
        title: 'Web Development',
        description:
          'Landing pages, company profiles and dashboards built with React and Next.js, backed by Supabase and deployed on Vercel or Cloudflare Pages. Built with AI assistance, then reviewed and tested.',
        items: [
          'Landing pages and company profiles',
          'Dashboards and internal tools',
          'React / Next.js front-ends',
          'Supabase databases and auth',
          'Deployment on Vercel and Cloudflare Pages',
          'AI-assisted development with Claude Code and Codex',
          'Performance and accessibility checks',
        ],
      },
      {
        index: '03',
        title: 'Product & Project Management',
        description:
          'From PRD to release: scoping, backlog, milestones and the QA plan that keeps a project honest.',
        items: [
          'SRS, PRD and design documents',
          'UI design in Figma and Google Stitch',
          'Backlog and milestone planning',
          'Stakeholder coordination',
          'QA planning and sign-off',
        ],
      },
    ],
  },
  projects: {
    label: 'Selected work',
    heading: 'Projects',
    roleLabel: 'Role',
    stackLabel: 'Stack',
    openScreenshots: 'Open screenshots of {title}',
    status: {
      live: 'Live',
      'in-qa': 'In QA',
      'in-development': 'In development',
      'in-design': 'In design',
      planned: 'Planned',
      completed: 'Research',
    },
    cta: {
      liveDemo: 'Live demo',
      liveDemoPrivate: 'Open app · invite only',
      github: 'GitHub',
      preview: 'Preview',
      previewDesigns: 'Preview designs',
      readPlan: 'Read the plan',
      readPaper: 'Read the paper (PDF)',
    },
    items: {
      pintukos: {
        title: 'PintuKos',
        description:
          'Finance app for the family’s boarding houses and rentals (private deployment): automatic invoices, payments with photo proof, WhatsApp billing, PDF/Excel reports, book closing and an audit log.',
        role: 'Product owner, QA & developer (AI-assisted)',
      },
      'trading-compass': {
        title: 'Trading Compass',
        description:
          'A trading discipline journal: log every trade, review your rules and see where discipline slips.',
        role: 'Full-stack developer, QA',
      },
      'malau-website': {
        title: 'Malau Pase community & genealogy website',
        description:
          'Community website and family tree (tarombo) for the Malau Pase clan, currently in UI/UX design.',
        role: 'Project manager',
      },
      'kos-kontrakan-landing': {
        title: 'Kos & Kontrakan Kenny — landing page',
        description:
          'Promotion and booking landing page for the family’s boarding houses and rentals: WhatsApp lead conversion, a phased feature blueprint (MVP, growth, scale) and competitive research. PRD and design are done; the build is in progress.',
        role: 'Product & business strategy',
      },
      'crypto-research': {
        title: 'Big Data Analysis to Detect Cryptocurrency Price Movement Patterns and Trends',
        description:
          'Bachelor thesis: a case study of the altcoin market, using big-data analysis to detect price movement patterns and trends.',
        role: 'Author (bachelor thesis)',
      },
    },
  },
  qa: {
    label: 'QA evidence',
    heading: 'How I test',
    statement:
      'On Kopra by Mandiri I tested a wholesale banking platform through UAT and regression cycles: about 250 test cases and 20 defects logged in Jira.',
    paragraph:
      'Kopra artifacts are confidential, so the evidence here comes from my own product, PintuKos: 2,000+ unit tests, 45 Playwright end-to-end runs across 14 flows with axe audits, 693 database checks and an 85-step UAT.',
    artifacts: {
      'ci-run': {
        title: 'CI run — main flows',
        caption:
          'GitHub Actions: Playwright end-to-end tests against a local Supabase, every job green',
      },
      'e2e-report': {
        title: 'E2E report — 45 passed',
        caption:
          'Playwright: 45 runs across 14 flows on phone and laptop viewports, accessibility scans included',
      },
      'uat-sheet': {
        title: 'UAT sheet — 85 steps',
        caption:
          'Acceptance test on the DEV environment: preparation and three sessions, every required step passed',
      },
    },
  },
  experience: {
    label: 'Experience & education',
    heading: 'Experience',
    educationHeading: 'Education',
    work: {
      period: 'Aug 2026 (1 month)',
      title: 'QA Tester (Manual Testing) — Project Kopra by Mandiri',
      org: 'PT Bank Mandiri (Persero) Tbk',
      location: 'Jakarta',
      description:
        'Internship / project contract via PT Bahtera Pesat Lintasbuana, testing Kopra by Mandiri, a wholesale digital banking platform.',
      bullets: [
        'Ran about 250 UAT and regression test cases',
        'Reported about 20 defects in Jira with reproduction steps and severity; about 90% were resolved before release',
        'Designed and documented structured test cases and test reports in Jira',
      ],
    },
    education: {
      period: '2021 — Jan 2026',
      title: 'Bachelor of Information Systems (S.Kom)',
      org: 'Universitas Gunadarma — Faculty of Computer Science & Information Technology',
      location: 'Depok',
      description:
        'GPA 3.43 / 4.00. Scientific paper (2024) on big-data analysis of altcoin prices.',
      bullets: [
        'Software QA and testing standards',
        'Big-data mining, machine learning and systems analysis',
        'Web programming and database design',
      ],
    },
    selfStudy: {
      period: 'Feb — Jul 2026',
      title: 'Self-study — Software engineering',
      org: 'Self-directed',
      location: '',
      description: 'JavaScript, React, TypeScript, Git and GitHub.',
      bullets: [],
    },
  },
  certifications: {
    label: 'Certifications',
    heading: 'Certifications',
    openCertificate: 'Open certificate: {title}',
    certificateNo: 'No.',
    verify: 'Verify',
    scope: 'Scope',
    carousel: {
      label: 'Certificates',
      frame: 'Certificates: arrow keys to browse, Enter to open',
      prev: 'Previous certificate',
      next: 'Next certificate',
      goTo: 'Go to certificate {n}',
      slide: '{n} of {count}',
      openCurrent: 'Open this certificate',
    },
    items: {
      'revou-intro-software-engineering': {
        title: 'Intro to Software Engineering',
        issuer: 'RevoU Coding Camp',
        period: 'September 2026',
        scope: '1-week certified online course · certificate of attendance',
      },
      'gunadarma-designing-software': {
        title: 'Designing Software',
        issuer: 'Universitas Gunadarma',
        period: 'May – Jun 2025',
        scope: 'Software design principles, modelling and documentation',
      },
      'gunadarma-desktop-programming': {
        title: 'Fundamental Desktop Programming — Java & Oracle PL/SQL',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2024',
        scope: 'Desktop applications in Java with Oracle PL/SQL databases',
      },
      'gunadarma-javascript-fundamentals': {
        title: 'JavaScript Programming Language Fundamentals',
        issuer: 'Universitas Gunadarma',
        period: 'Nov 2023',
        scope: 'Core JavaScript: syntax, functions, the DOM and asynchronous code',
      },
    },
  },
  reachOut: {
    label: 'Reach out',
    ticker: 'Reach Out —',
    heading: 'Let’s work together',
    intro: 'Recruiters: grab the CV and email me. Clients: WhatsApp is the fastest way to start.',
    polaroids: {
      alts: {
        'comprehensive-exam':
          'Kenny and a classmate in white shirts and black ties on the day of his comprehensive exam at Gunadarma University',
        graduation: 'Kenny in graduation gown with his parents',
        'working-laptop': 'Kenny coding on his laptop at a café at night',
        'nusa-penida': 'Kenny on the cliffs of Nusa Penida',
        touring: 'Kenny with his motorbike at a mountain viewpoint',
        portrait: 'Kenny in a batik shirt and Bank Mandiri lanyard, mirror selfie',
      },
      region: 'Photos of Ananda Kenny',
      previous: 'Previous photo',
      next: 'Next photo',
      pause: 'Pause slideshow',
      play: 'Play slideshow',
      status: 'Photo {current} of {total}',
    },
    email: { label: 'Email', copy: 'Copy email', copied: 'Copied' },
    whatsapp: {
      label: 'WhatsApp',
      prefill: 'Hi Kenny, I found your portfolio and I’d like to talk about ',
    },
    location: { label: 'Location', value: 'East Jakarta, Indonesia · on-site, hybrid or remote' },
    availability: 'Open to work',
    ctas: { email: 'Email me', cv: 'Download CV (Indonesian)', whatsapp: 'Chat on WhatsApp' },
    socialsLabel: 'Elsewhere',
    backToTop: 'Back to top',
  },
  lightbox: {
    label: 'Image viewer',
    close: 'Close',
    previous: 'Previous image',
    next: 'Next image',
    counter: '{current} / {total}',
  },
  footer: {
    copyright: '© {year} Ananda Kenny',
    builtWith: 'Built with Next.js, GSAP & React Three Fiber, with Claude Code',
    languageNote: 'Available in English and Bahasa Indonesia.',
  },
  notFound: {
    label: '404',
    title: 'Page not found — Ananda Kenny',
    heading: 'This page doesn’t exist',
    body: 'The link may be old or mistyped. Everything else is on the home page.',
    cta: 'Back to the home page',
  },
} satisfies Copy

export default en
