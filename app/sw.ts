import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Shell de la app: HTML — CacheFirst con revalidación
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 5,
      }),
    },
    {
      // JS/CSS del bundle — CacheFirst (inmutables por hash)
      matcher: ({ url }) => url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({
        cacheName: 'next-static',
      }),
    },
    {
      // API de Supabase — NetworkFirst con fallback a caché
      matcher: ({ url }) => url.hostname.includes('supabase.co'),
      handler: new NetworkFirst({
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 5,
      }),
    },
    {
      // Imágenes — StaleWhileRevalidate
      matcher: ({ request }) => request.destination === 'image',
      handler: new StaleWhileRevalidate({
        cacheName: 'images',
      }),
    },
    {
      // Fuentes de Google — CacheFirst (raramente cambian)
      matcher: ({ url }) =>
        url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
      handler: new CacheFirst({
        cacheName: 'google-fonts',
      }),
    },
  ],
})

serwist.addEventListeners()
