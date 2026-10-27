/** Indonesian copy — a translation of content/en.ts with the same shape. */
import type { Copy } from './types'

const id = {
  meta: {
    title: 'Ananda Kenny — Software Engineer dengan fondasi QA',
    description:
      'Portofolio Ananda Kenny, software engineer serta QA & web developer di Jakarta Timur, Indonesia. Produk web dibangun dengan Next.js dan diuji seperti pengguna sungguhan.',
  },
  nav: {
    brand: '© Ananda Kenny',
    work: 'Karya',
    about: 'Tentang',
    contact: 'Kontak',
    downloadCv: 'Unduh CV',
    skipToContent: 'Lompat ke konten',
    language: 'Bahasa',
    menu: 'Menu',
  },
  hero: {
    name: 'Ananda Kenny',
    roles: ['Software Engineer', 'QA & Web Developer'],
    availability: 'Terbuka untuk bekerja',
    socials: { linkedin: 'LinkedIn', github: 'GitHub', whatsapp: 'WhatsApp' },
    scrollCue: 'Perkenalan',
  },
  intro: {
    label: 'Perkenalan',
    statement: [
      { text: 'Saya software engineer dengan ' },
      { text: 'pola pikir QA', accent: true },
      { text: ' — saya membangun produk web dan ' },
      { text: 'mengujinya seperti pengguna sungguhan', accent: true },
      { text: '.' },
    ],
    paragraph:
      'Sarjana Sistem Informasi dari Universitas Gunadarma, dengan pengalaman QA langsung di Project Kopra, Bank Mandiri. Saya merancang, membangun, dan menguji produk web dari awal sampai akhir, lengkap dengan dokumentasinya.',
    seeWork: 'Lihat karya saya',
    downloadCv: 'Unduh CV',
  },
  services: {
    label: 'Yang saya kerjakan',
    heading: 'Yang saya kerjakan',
    cards: [
      {
        index: '01',
        title: 'Quality Assurance & Testing',
        description:
          'Pengujian manual dan UAT yang menangkap hal-hal yang terlewat oleh pemeriksaan otomatis, didokumentasikan agar tim bisa menindaklanjutinya.',
        items: [
          'Pengujian manual & UAT dengan siklus regresi',
          'Perancangan skenario dan test case',
          'Perencanaan regresi dan pelaporan eksekusi',
          'Pelaporan bug dan siklus hidup defect di Jira',
          'Exploratory testing',
          'Dasar-dasar pengujian API',
        ],
      },
      {
        index: '02',
        title: 'Pengembangan Web',
        description:
          'Landing page, company profile, dan dashboard yang dibangun dengan Next.js dan React, didukung Supabase, dan di-deploy di Vercel.',
        items: [
          'Landing page dan company profile',
          'Dashboard dan tools internal',
          'Front-end Next.js / React',
          'Database dan autentikasi Supabase',
          'Deployment di Vercel',
          'Pemeriksaan performa dan aksesibilitas',
        ],
      },
      {
        index: '03',
        title: 'Manajemen Produk & Proyek',
        description:
          'Dari PRD sampai rilis: penentuan lingkup, backlog, milestone, dan rencana QA yang menjaga proyek tetap jujur.',
        items: [
          'PRD dan dokumen desain',
          'Perencanaan backlog dan milestone',
          'Koordinasi pemangku kepentingan',
          'Perencanaan dan sign-off QA',
        ],
      },
    ],
  },
  projects: {
    label: 'Karya pilihan',
    heading: 'Proyek',
    roleLabel: 'Peran',
    stackLabel: 'Teknologi',
    status: {
      live: 'Live',
      'in-qa': 'Tahap QA',
      'in-development': 'Dalam pengembangan',
      'in-design': 'Tahap desain',
      planned: 'Direncanakan',
      completed: 'Riset',
    },
    cta: {
      liveDemo: 'Demo langsung',
      github: 'GitHub',
      preview: 'Pratinjau',
      previewDesigns: 'Pratinjau desain',
      readPlan: 'Baca rencananya',
      readPaper: 'Baca makalahnya (PDF)',
    },
    items: {
      pintukos: {
        title: 'PintuKos',
        description:
          'Manajemen keuangan untuk kos dan kontrakan: pantau kamar, penghuni, pembayaran, dan arus kas bulanan di satu tempat.',
        role: 'Full-stack developer, produk',
      },
      'trading-compass': {
        title: 'Trading Compass',
        description:
          'Jurnal disiplin trading: catat setiap transaksi, tinjau aturan Anda, dan lihat di mana disiplin mulai goyah.',
        role: 'Full-stack developer, QA',
      },
      'malau-website': {
        title: 'Situs komunitas & silsilah Malau Pase',
        description:
          'Situs komunitas dan pohon silsilah (tarombo) untuk marga Malau Pase, saat ini dalam tahap desain UI/UX.',
        role: 'Project manager',
      },
      'kos-kontrakan-landing': {
        title: 'Kos & Kontrakan Kenny — landing page',
        description:
          'Konsep landing page untuk usaha kos dan kontrakan, dirumuskan dalam PRD dan dokumen desain.',
        role: 'Strategi produk & bisnis',
      },
      'crypto-research': {
        title: 'Analisis Big Data untuk Mendeteksi Pola dan Tren Pergerakan Harga Cryptocurrency',
        description:
          'Skripsi: studi kasus pasar altcoin, menggunakan analisis big data untuk mendeteksi pola dan tren pergerakan harga.',
        role: 'Penulis (skripsi)',
      },
    },
  },
  qa: {
    label: 'Bukti QA',
    heading: 'Cara saya menguji',
    statement:
      'Di Bank Mandiri saya menguji Project Kopra, super-platform digital wholesale, melalui siklus pengujian manual dan UAT.',
    paragraph:
      'Artefak Project Kopra bersifat rahasia, jadi dokumen di sini berasal dari produk saya sendiri: test plan, test case, dan laporan bug yang dihasilkan saat membawa Trading Compass melewati tahap QA.',
    artifacts: [
      {
        title: 'Test plan',
        caption: 'Trading Compass · lingkup, risiko, kriteria masuk dan keluar',
      },
      { title: 'Test case', caption: 'Trading Compass · kasus tingkat skenario dan langkah' },
      { title: 'Laporan bug', caption: 'Trading Compass · severity, langkah reproduksi, re-test' },
    ],
  },
  experience: {
    label: 'Pengalaman & pendidikan',
    heading: 'Pengalaman',
    educationHeading: 'Pendidikan',
    work: {
      period: '',
      title: 'Quality Assurance — Project Kopra by Mandiri',
      org: 'PT Bank Mandiri (Persero) Tbk',
      location: 'Jakarta',
      description: 'QA di Kopra by Mandiri, super-platform digital wholesale.',
      bullets: [
        'Pengujian manual dan UAT dengan siklus regresi',
        'Perancangan skenario dan test case; pelaporan eksekusi di Atlassian Jira',
        'Pelacakan siklus hidup defect di Jira: severity, re-test, dan sign-off',
      ],
    },
    education: {
      period: '',
      title: 'Sarjana Sistem Informasi (S.Kom)',
      org: 'Universitas Gunadarma — Fakultas Ilmu Komputer & Teknologi Informasi',
      location: 'Depok',
      description: '',
      bullets: [
        'Standar QA dan pengujian perangkat lunak',
        'Big-data mining, machine learning, dan analisis sistem',
        'Pengembangan web full-stack dan arsitektur database',
      ],
    },
  },
  certifications: {
    label: 'Sertifikasi',
    heading: 'Sertifikasi',
    items: [
      {
        title: 'Designing Software',
        issuer: 'Universitas Gunadarma',
        period: 'Mei – Jun 2025',
        scope: 'Prinsip desain perangkat lunak, pemodelan, dan dokumentasi',
      },
      {
        title: 'JavaScript Programming Language Fundamentals',
        issuer: 'Universitas Gunadarma',
        period: 'Nov 2023',
        scope: 'Dasar JavaScript: sintaks, fungsi, DOM, dan kode asinkron',
      },
      {
        title: 'Fundamental Desktop Programming — Java & Oracle PL/SQL',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2024',
        scope: 'Aplikasi desktop dengan Java dan database Oracle PL/SQL',
      },
    ],
  },
  reachOut: {
    label: 'Hubungi saya',
    ticker: 'Reach Out —',
    heading: 'Mari bekerja sama',
    intro:
      'Rekruter: unduh CV dan kirim email. Klien: WhatsApp adalah cara tercepat untuk memulai.',
    email: { label: 'Email', copy: 'Salin email', copied: 'Tersalin' },
    whatsapp: {
      label: 'WhatsApp',
      prefill: 'Halo Kenny, saya menemukan portofolio Anda dan ingin berdiskusi tentang ',
    },
    location: { label: 'Lokasi', value: 'Jakarta Timur, Indonesia · on-site, hybrid, atau remote' },
    availability: 'Terbuka untuk bekerja',
    ctas: { email: 'Kirim email', whatsapp: 'Chat di WhatsApp' },
    socialsLabel: 'Tautan lain',
    backToTop: 'Kembali ke atas',
  },
  footer: {
    copyright: '© {year} Ananda Kenny',
    builtWith: 'Dibangun dengan Next.js, GSAP & React Three Fiber',
    languageNote: 'Tersedia dalam bahasa Inggris dan Indonesia.',
  },
} satisfies Copy

export default id
