import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import Providers from '@/components/providers'
import ServiceWorkerRegister from '@/components/sw-register'
import './globals.css'

/* ------------------------------------------------------------
   FUENTES — Plus Jakarta Sans para display/titulares
               Inter para cuerpo y UI
   ------------------------------------------------------------ */
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

/* ------------------------------------------------------------
   VIEWPORT — viewport-fit=cover para iOS notch
   ------------------------------------------------------------ */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1A3CFF',
}

/* ------------------------------------------------------------
   METADATA — PWA completa
   ------------------------------------------------------------ */
export const metadata: Metadata = {
  title: 'saliendo.ve — Pasajes de autobús en Venezuela',
  description:
    'Compra tus pasajes de autobús interurbano en Venezuela. Rápido, seguro y desde tu celular.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'saliendo.ve',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'saliendo.ve — Pasajes de autobús en Venezuela',
    description:
      'Compra tus pasajes de autobús interurbano en Venezuela. Rápido, seguro y desde tu celular.',
    locale: 'es_VE',
    type: 'website',
  },
}

/* ------------------------------------------------------------
   ROOT LAYOUT
   ------------------------------------------------------------ */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="font-body text-ink-900 bg-white antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
