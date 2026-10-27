/** English copy (default language). Source: PRD §5, Appendix A, DESIGN §4. */
import type { Copy } from './types'

const en = {
  meta: {
    title: 'Ananda Kenny — Software Engineer with a QA foundation',
    description:
      'Portfolio of Ananda Kenny, a software engineer and QA & web developer in East Jakarta, Indonesia. Web products built with Next.js and tested like a user would.',
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
  },
  hero: {
    name: 'Ananda Kenny',
    roles: ['Software Engineer', 'QA & Web Developer'],
    availability: 'Open to work',
    socials: { linkedin: 'LinkedIn', github: 'GitHub', whatsapp: 'WhatsApp' },
    scrollCue: 'Intro',
  },
  intro: {
    label: 'Intro',
    statement: [
      { text: 'I’m a software engineer with a ' },
      { text: 'QA mindset', accent: true },
      { text: ' — I build web products and ' },
      { text: 'test them like a user would', accent: true },
      { text: '.' },
    ],
    paragraph:
      'Bachelor of Information Systems from Universitas Gunadarma, with hands-on QA experience on Project Kopra at Bank Mandiri. I design, build and test web products end to end, and I write the documentation that goes with them.',
    seeWork: 'See my work',
    downloadCv: 'Download CV',
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
          'API testing basics',
        ],
      },
      {
        index: '02',
        title: 'Web Development',
        description:
          'Landing pages, company profiles and dashboards built with Next.js and React, backed by Supabase and deployed on Vercel.',
        items: [
          'Landing pages and company profiles',
          'Dashboards and internal tools',
          'Next.js / React front-ends',
          'Supabase databases and auth',
          'Deployment on Vercel',
          'Performance and accessibility checks',
        ],
      },
      {
        index: '03',
        title: 'Product & Project Management',
        description:
          'From PRD to release: scoping, backlog, milestones and the QA plan that keeps a project honest.',
        items: [
          'PRD and design documents',
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
          'Financial management for boarding houses and rentals: track rooms, tenants, payments and monthly cash flow in one place.',
        role: 'Full-stack developer, product',
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
          'Landing page concept for a boarding house and rental business, specified in a PRD and design document.',
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
      'At Bank Mandiri I tested Project Kopra, a wholesale digital super-platform, through manual and UAT cycles.',
    paragraph:
      'Project artifacts from Kopra are confidential, so the documents here come from my own products: the test plan, test cases and bug reports produced while taking Trading Compass through QA.',
    artifacts: [
      { title: 'Test plan', caption: 'Trading Compass · scope, risks, entry and exit criteria' },
      { title: 'Test cases', caption: 'Trading Compass · scenario- and step-level cases' },
      { title: 'Bug report', caption: 'Trading Compass · severity, steps to reproduce, re-test' },
    ],
  },
  experience: {
    label: 'Experience & education',
    heading: 'Experience',
    educationHeading: 'Education',
    work: {
      period: '',
      title: 'Quality Assurance — Project Kopra by Mandiri',
      org: 'PT Bank Mandiri (Persero) Tbk',
      location: 'Jakarta',
      description: 'QA on Kopra by Mandiri, a wholesale digital super-platform.',
      bullets: [
        'Manual and UAT testing with regression cycles',
        'Test scenario and test case design; execution reporting in Atlassian Jira',
        'Defect lifecycle tracking in Jira: severity, re-test and sign-off',
      ],
    },
    education: {
      period: '',
      title: 'Bachelor of Information Systems (S.Kom)',
      org: 'Universitas Gunadarma — Faculty of Computer Science & Information Technology',
      location: 'Depok',
      description: '',
      bullets: [
        'Software QA and testing standards',
        'Big-data mining, machine learning and systems analysis',
        'Full-stack web development and database architecture',
      ],
    },
  },
  certifications: {
    label: 'Certifications',
    heading: 'Certifications',
    items: [
      {
        title: 'Designing Software',
        issuer: 'Universitas Gunadarma',
        period: 'May – Jun 2025',
        scope: 'Software design principles, modelling and documentation',
      },
      {
        title: 'JavaScript Programming Language Fundamentals',
        issuer: 'Universitas Gunadarma',
        period: 'Nov 2023',
        scope: 'Core JavaScript: syntax, functions, the DOM and asynchronous code',
      },
      {
        title: 'Fundamental Desktop Programming — Java & Oracle PL/SQL',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2024',
        scope: 'Desktop applications in Java with Oracle PL/SQL databases',
      },
    ],
  },
  reachOut: {
    label: 'Reach out',
    ticker: 'Reach Out —',
    heading: 'Let’s work together',
    intro: 'Recruiters: grab the CV and email me. Clients: WhatsApp is the fastest way to start.',
    email: { label: 'Email', copy: 'Copy email', copied: 'Copied' },
    whatsapp: {
      label: 'WhatsApp',
      prefill: 'Hi Kenny, I found your portfolio and I’d like to talk about ',
    },
    location: { label: 'Location', value: 'East Jakarta, Indonesia · on-site, hybrid or remote' },
    availability: 'Open to work',
    ctas: { email: 'Email me', whatsapp: 'Chat on WhatsApp' },
    socialsLabel: 'Elsewhere',
    backToTop: 'Back to top',
  },
  footer: {
    copyright: '© {year} Ananda Kenny',
    builtWith: 'Built with Next.js, GSAP & React Three Fiber',
    languageNote: 'Available in English and Bahasa Indonesia.',
  },
} satisfies Copy

export default en
