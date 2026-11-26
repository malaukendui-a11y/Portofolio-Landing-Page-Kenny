/** Indonesian copy — a translation of content/en.ts with the same shape. */
import type { Copy } from './types'

const id = {
  meta: {
    title: 'Ananda Kenny — Junior QA & Software Engineer',
    description:
      'Portofolio Ananda Kenny, junior QA dan software engineer di Jakarta Timur. Produk web yang dibangun dengan AI dan diuji seperti pengguna sungguhan.',
    og: {
      label: 'Portofolio',
      alt: 'Kartu portofolio: “Ananda Kenny” dalam huruf besar di atas kertas hangat, dengan peran Junior QA Engineer dan Junior Software Engineer',
    },
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
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
  },
  hero: {
    name: 'Ananda Kenny',
    roles: ['Junior QA Engineer', 'Junior Software Engineer'],
    availability: 'Terbuka untuk bekerja',
    socials: { linkedin: 'LinkedIn', github: 'GitHub', whatsapp: 'WhatsApp' },
    scrollCue: 'Perkenalan',
    portraitAlt: 'Ananda Kenny mengenakan jas gelap dan dasi, menatap kamera',
  },
  intro: {
    label: 'Perkenalan',
    statement: [
      { text: 'Saya lulusan Sistem Informasi yang ' },
      { text: 'sedang mendalami software engineering', accent: true },
      { text: ' — saya membangun dengan AI dan ' },
      { text: 'menguji semuanya seperti pengguna', accent: true },
      { text: '.' },
    ],
    paragraph:
      'Sarjana Sistem Informasi, Universitas Gunadarma (IPK 3,43, Januari 2026), dan QA Tester di Kopra by Mandiri. Saya membangun produk nyata bersama agen AI seperti Claude Code dan Codex, lalu meninjau dan menguji setiap perubahan. PintuKos punya 2.000+ unit test; situs ini menjalankan 600+ uji otomatis di setiap pull request.',
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
          'Perancangan skenario & test case',
          'Perencanaan regresi dan laporan eksekusi',
          'Pelaporan bug dan siklus defect di Jira',
          'Exploratory testing',
          'Uji otomatis dengan Playwright dan Vitest di proyek saya sendiri',
        ],
      },
      {
        index: '02',
        title: 'Pengembangan Web',
        description:
          'Landing page, company profile, dan dashboard dengan React dan Next.js, didukung Supabase, dan di-deploy di Vercel atau Cloudflare Pages. Dibangun dengan bantuan AI, lalu ditinjau dan diuji.',
        items: [
          'Landing page dan company profile',
          'Dashboard dan tools internal',
          'Front-end React / Next.js',
          'Database dan autentikasi Supabase',
          'Deployment di Vercel dan Cloudflare Pages',
          'Pengembangan berbantuan AI dengan Claude Code dan Codex',
          'Pengecekan performa dan aksesibilitas',
        ],
      },
      {
        index: '03',
        title: 'Manajemen Produk & Proyek',
        description:
          'Dari PRD sampai rilis: penentuan lingkup, backlog, milestone, dan rencana QA yang menjaga proyek tetap jujur.',
        items: [
          'Dokumen SRS, PRD, dan desain',
          'Desain UI di Figma dan Google Stitch',
          'Perencanaan backlog dan milestone',
          'Koordinasi stakeholder',
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
    openScreenshots: 'Buka tangkapan layar {title}',
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
      liveDemoPrivate: 'Buka aplikasi · hanya undangan',
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
          'Aplikasi keuangan untuk kos dan kontrakan keluarga (dipakai internal): tagihan otomatis, pembayaran dengan bukti foto, penagihan via WhatsApp, laporan PDF/Excel, tutup buku, dan log audit.',
        role: 'Product owner, QA & developer (berbantuan AI)',
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
          'Landing page promosi dan pemesanan untuk kos dan kontrakan keluarga: konversi prospek lewat WhatsApp, cetak biru fitur bertahap (MVP, tumbuh, skala), dan riset kompetitor. PRD dan desain selesai; pembangunan sedang berjalan.',
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
      'Di Kopra by Mandiri saya menguji platform wholesale banking lewat siklus UAT dan regresi: sekitar 250 test case dan 20 defect tercatat di Jira.',
    paragraph:
      'Artefak Kopra bersifat rahasia, jadi bukti di sini berasal dari produk saya sendiri, PintuKos: 2.000+ unit test, 45 jalan uji end-to-end Playwright di 14 alur dengan audit axe, 693 cek database, dan UAT 85 langkah.',
    artifacts: {
      'ci-run': {
        title: 'Jalan CI — alur utama',
        caption:
          'GitHub Actions: pengujian end-to-end Playwright dengan Supabase lokal, semua job hijau',
      },
      'e2e-report': {
        title: 'Laporan E2E — 45 lulus',
        caption:
          'Playwright: 45 jalan uji di 14 alur pada viewport HP dan laptop, termasuk pemindaian aksesibilitas',
      },
      'uat-sheet': {
        title: 'Lembar UAT — 85 langkah',
        caption:
          'Uji penerimaan di lingkungan DEV: persiapan dan tiga sesi, semua langkah wajib sesuai',
      },
    },
  },
  experience: {
    label: 'Pengalaman & pendidikan',
    heading: 'Pengalaman',
    educationHeading: 'Pendidikan',
    work: {
      period: 'Agu 2026',
      title: 'QA Tester (Pengujian Manual) — Project Kopra by Mandiri',
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
      period: '2021 — Jan 2026',
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
    openCertificate: 'Buka sertifikat: {title}',
    certificateNo: 'No.',
    verify: 'Verifikasi',
    scope: 'Cakupan',
    carousel: {
      label: 'Sertifikat',
      frame: 'Sertifikat: tombol panah untuk berpindah, Enter untuk membuka',
      prev: 'Sertifikat sebelumnya',
      next: 'Sertifikat berikutnya',
      goTo: 'Ke sertifikat {n}',
      slide: '{n} dari {count}',
      openCurrent: 'Buka sertifikat ini',
    },
    items: {
      'revou-intro-software-engineering': {
        title: 'Intro to Software Engineering',
        issuer: 'RevoU Coding Camp',
        period: 'September 2026',
        scope: 'Kursus online bersertifikat 1 minggu · sertifikat kehadiran',
      },
      'gunadarma-designing-software': {
        title: 'Designing Software',
        issuer: 'Universitas Gunadarma',
        period: 'Mei – Jun 2025',
        scope: 'Prinsip desain perangkat lunak, pemodelan, dan dokumentasi',
      },
      'gunadarma-desktop-programming': {
        title: 'Fundamental Desktop Programming — Java & Oracle PL/SQL',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2024',
        scope: 'Aplikasi desktop dengan Java dan database Oracle PL/SQL',
      },
      'gunadarma-javascript-fundamentals': {
        title: 'JavaScript Programming Language Fundamentals',
        issuer: 'Universitas Gunadarma',
        period: 'Nov 2023',
        scope: 'Dasar JavaScript: sintaks, fungsi, DOM, dan kode asinkron',
      },
    },
  },
  reachOut: {
    label: 'Hubungi saya',
    ticker: 'Reach Out —',
    heading: 'Mari bekerja sama',
    intro:
      'Rekruter: unduh CV dan kirim email. Klien: WhatsApp adalah cara tercepat untuk memulai.',
    polaroids: {
      alts: {
        'comprehensive-exam':
          'Kenny dan seorang teman kuliah berkemeja putih dan berdasi hitam pada hari ujian komprehensifnya di Universitas Gunadarma',
        graduation: 'Kenny mengenakan toga wisuda bersama orang tuanya',
        'working-laptop': 'Kenny menulis kode di laptopnya di sebuah kafe pada malam hari',
        'nusa-penida': 'Kenny di tebing Nusa Penida',
        touring: 'Kenny bersama sepeda motornya di sebuah titik pandang pegunungan',
        portrait: 'Swafoto cermin Kenny dengan kemeja batik dan tali lanyard Bank Mandiri',
      },
      region: 'Foto-foto Ananda Kenny',
      previous: 'Foto sebelumnya',
      next: 'Foto berikutnya',
      pause: 'Jeda tayangan foto',
      play: 'Putar tayangan foto',
      status: 'Foto {current} dari {total}',
    },
    email: { label: 'Email', copy: 'Salin email', copied: 'Tersalin' },
    whatsapp: {
      label: 'WhatsApp',
      prefill: 'Halo Kenny, saya menemukan portofolio Anda dan ingin berdiskusi tentang ',
    },
    location: { label: 'Lokasi', value: 'Jakarta Timur, Indonesia · on-site, hybrid, atau remote' },
    availability: 'Terbuka untuk bekerja',
    ctas: { email: 'Kirim email', cv: 'Unduh CV', whatsapp: 'Chat di WhatsApp' },
    socialsLabel: 'Tautan lain',
    backToTop: 'Kembali ke atas',
  },
  lightbox: {
    label: 'Penampil gambar',
    close: 'Tutup',
    previous: 'Gambar sebelumnya',
    next: 'Gambar berikutnya',
    counter: '{current} / {total}',
  },
  footer: {
    copyright: '© {year} Ananda Kenny',
    builtWith: 'Dibangun dengan Next.js, GSAP & React Three Fiber, bersama Claude Code',
    languageNote: 'Tersedia dalam bahasa Inggris dan Indonesia.',
  },
  notFound: {
    label: '404',
    title: 'Halaman tidak ditemukan — Ananda Kenny',
    heading: 'Halaman ini tidak ada',
    body: 'Tautannya mungkin sudah lama atau salah ketik. Semua yang lain ada di halaman utama.',
    cta: 'Kembali ke halaman utama',
  },
} satisfies Copy

export default id
