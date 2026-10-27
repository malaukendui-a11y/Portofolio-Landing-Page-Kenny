/**
 * Self-hosted fonts (DESIGN §3.2, PRD §8): Inter Display, Inter, DM Mono — all OFL.
 * Files live in public/fonts (DESIGN Appendix). No external font requests.
 */
import localFont from 'next/font/local'

export const interDisplay = localFont({
  src: [
    { path: '../public/fonts/InterDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/InterDisplay-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-inter-display',
  display: 'swap',
  preload: true,
})

export const inter = localFont({
  src: [
    { path: '../public/fonts/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Inter-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const dmMono = localFont({
  src: [
    { path: '../public/fonts/DMMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/DMMono-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
})

export const fontClassNames = `${interDisplay.variable} ${inter.variable} ${dmMono.variable}`
