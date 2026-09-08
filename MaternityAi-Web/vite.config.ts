import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['image/logo.png', 'image/logo.svg'],
      manifest: {
        name: 'MaternityAI',
        short_name: 'MaternityAI',
        description: 'Plataforma de salud materna inteligente',
        theme_color: '#c2185b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['medical', 'health', 'lifestyle'],
        shortcuts: [
          {
            name: 'Chat con IA',
            short_name: 'Chat IA',
            description: 'Habla con el asistente de salud materna',
            url: '/ai',
            icons: [{ src: 'image/logo.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Control de Actividad',
            short_name: 'Actividad',
            description: 'Ver mis cuestionarios y citas',
            url: '/actividad',
            icons: [{ src: 'image/logo.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          {
            src: 'image/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'image/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'image/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cachea todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Estrategia: red primero para las llamadas a la API
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'maternity-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              networkTimeoutSeconds: 10,
              // Asegura que las peticiones se realicen con CORS para mantener cabeceras correctas
              fetchOptions: {
                mode: 'cors',
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maternity-images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
        ],
      },
      devOptions: {
        // Desactiva el SW en desarrollo para evitar problemas de CORS y caché obsoleta
        enabled: false,
      },
    }),
  ],
});
