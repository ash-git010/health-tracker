import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/health-tracker/',
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon-v3.png'],
      manifest: {
        name: 'Upkeep',
        short_name: 'Upkeep',
        description: 'Personal health, nutrition and routine tracker',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/health-tracker/',
        scope: '/health-tracker/',
        icons: [
          { src: 'icon-192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})