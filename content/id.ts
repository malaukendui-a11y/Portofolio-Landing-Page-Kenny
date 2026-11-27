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
      'Sarjana Sistem Informasi, Universitas Gunadarma (IPK 3,43, Januari 2026), dan QA Tester di Kopra by Mandiri. Saya membangun produk nyata bersama agen AI seperti Claude Code dan Codex, lalu meninjau dan menguji setiap perubahan. PintuKos punya 2.000+ unit test; situs ini punya 180+ uji otomatis yang berjalan di Chromium, Firefox, dan WebKit di setiap pull request.',
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
          'Aplikasi keuangan untuk kos dan kontrakan keluarga (dipakai internal): tagihan otomatis, pembayaran dengan bukti foto, penagihan via WhatsApp, laporan PDF/Excel, tutup buku, dan log audit. Beta privat; demo tersedia atas permintaan.',
        role: 'Product owner, QA & developer (berbantuan AI)',
      },
      portfolio: {
        title: 'Portofolio ini',
        description:
          'Situs yang sedang Anda buka: portofolio dwibahasa dengan lensa kaca 3D, dibangun dengan Claude Code, dan setiap pull request ditinjau sebelum digabung. Setiap perubahan lolos 180+ uji otomatis di Chromium, Firefox, dan WebKit, pengecekan Lighthouse, serta QA manual saya di iPhone dan HP Android.',
        role: 'Developer & QA (berbantuan AI)',
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
          'Website komunitas dan silsilah (tarombo) marga Malau Pase. Saya memimpinnya bersama satu data analyst: ruang lingkup, SRS 22 halaman, dan PRD sudah selesai; desain UI/UX sedang dikerjakan di Google Stitch dan Figma.',
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
          'Penulisan Ilmiah, Universitas Gunadarma, 2024: studi kasus pasar altcoin dengan regresi, K-Means clustering, dan model Random Forest pada data harga dan volume.',
        role: 'Penulis',
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
      period: 'Agu 2026 (1 bulan)',
      title: 'QA Tester (Pengujian Manual) — Project Kopra by Mandiri',
      org: 'PT Bank Mandiri (Persero) Tbk',
      location: 'Jakarta',
      description:
        'Magang / kontrak proyek melalui PT Bahtera Pesat Lintasbuana, menguji Kopra by Mandiri, platform digital wholesale banking.',
      bullets: [
        'Mengeksekusi sekitar 250 test case UAT dan regresi',
        'Melaporkan sekitar 20 defect di Jira dengan langkah reproduksi dan severity; sekitar 90% diselesaikan sebelum rilis',
        'Merancang dan mendokumentasikan test case dan test report terstruktur di Jira',
      ],
    },
    education: {
      period: '2021 — Jan 2026',
      title: 'Sarjana Sistem Informasi (S.Kom)',
      org: 'Universitas Gunadarma — Fakultas Ilmu Komputer & Teknologi Informasi',
      location: 'Depok',
      description:
        'IPK 3,43 / 4,00. Penulisan Ilmiah (2024) tentang analisis big data harga altcoin.',
      bullets: [
        'Standar QA dan pengujian perangkat lunak',
        'Big-data mining, machine learning, dan analisis sistem',
        'Pemrograman web dan perancangan basis data',
      ],
    },
    selfStudy: {
      period: 'Feb — Jul 2026',
      title: 'Belajar mandiri — Software engineering',
      org: 'Otodidak',
      location: '',
      description: 'JavaScript, React, TypeScript, Git, dan GitHub.',
      bullets: [],
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
        scope: 'Kursus online 1 minggu · sertifikat kehadiran · proyek mini: web pencatat keuangan',
      },
      'gunadarma-designing-software': {
        title: 'Merancang Perangkat Lunak',
        issuer: 'Universitas Gunadarma',
        period: 'Mei – Jun 2025',
        scope: 'Struktur dan komponen perangkat lunak, perancangan UI dan UX',
      },
      'gunadarma-go-lang-for-beginner': {
        title: 'Pemrograman Go untuk Tingkat Pemula',
        issuer: 'Universitas Gunadarma',
        period: 'Agu 2024',
        scope:
          'Dasar Go: tipe data, perulangan dan percabangan, struct, pointer, slice, map; web server Go dengan Polymer',
      },
      'gunadarma-desktop-programming': {
        title: 'Dasar Pemrograman Berbasis Desktop',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2024',
        scope: 'Delphi, Visual Basic .NET, dan Java (AWT, Swing), dengan pengenalan Oracle PL/SQL',
      },
      'gunadarma-javascript-fundamentals': {
        title: 'Dasar Bahasa Pemrograman JavaScript',
        issuer: 'Universitas Gunadarma',
        period: 'Nov 2023',
        scope:
          'Variabel dan tipe data, operator, array, percabangan dan perulangan, serta JavaScript berorientasi objek',
      },
      'gunadarma-fundamental-web-programming': {
        title: 'Dasar Pemrograman Berbasis Web',
        issuer: 'Universitas Gunadarma',
        period: 'Feb 2022',
        scope: 'Pengantar pemrograman web dengan Go, Java EE (Servlet, JSP), dan ASP.NET dengan C#',
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
