/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH is set by the deploy workflows (ADR-0005):
//   main:       /3d-quiz-game/
//   PR preview: /3d-quiz-game/pr-preview/pr-<N>/
const base = process.env.BASE_PATH ?? '/';
// PR previews share the origin with the main site: no service worker there (ADR-0008).
const isPreview = base.includes('/pr-preview/');

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      disable: isPreview,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'Labyrinth-Abenteuer',
        short_name: 'Labyrinth',
        description: 'Ein Lernspiel für Kinder von 5 bis 7: Labyrinthe, Schatzkisten, Mathe und Deutsch.',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#bfe8ff',
        theme_color: '#7fcf5f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell is precached; voice clips are cached when first played (or via the
        // parents area "Für offline speichern").
        // .glb: hand-made avatar models (public/models/), small and needed offline.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2,glb}'],
        globIgnores: ['**/node_modules/**'],
        navigateFallbackDenylist: [/\/pr-preview\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/audio\/de\/[0-9a-z]+\.mp3$/.test(url.pathname) && !url.pathname.includes('/pr-preview/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'voice-clips',
              expiration: { maxEntries: 5000 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
