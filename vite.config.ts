import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
        },
        manifest: {
          name: 'Speaking Buddy',
          short_name: 'SpeakingBuddy',
          description: 'AI-Powered English Speaking Tutor',
          theme_color: '#10b981',
          background_color: '#0d0d0f',
          display: 'standalone',
          icons: [
            {
              src: 'https://api.iconify.design/lucide:orbit.svg?color=%2310b981&width=192&height=192',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'https://api.iconify.design/lucide:orbit.svg?color=%2310b981&width=512&height=512',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/v1beta': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => {
            if (!apiKey || apiKey === 'proxy_key') return p;
            const cleanPath = p.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
            return cleanPath + (cleanPath.includes('?') ? '&' : '?') + 'key=' + apiKey;
          },
          headers: (apiKey && apiKey !== 'proxy_key') ? {
            'x-goog-api-key': apiKey
          } : undefined
        },
        '/ws': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          ws: true,
          secure: true,
          rewrite: (p) => {
            if (!apiKey || apiKey === 'proxy_key') return p;
            const cleanPath = p.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
            return cleanPath + (cleanPath.includes('?') ? '&' : '?') + 'key=' + apiKey;
          }
        }
      }
    },
  };
});
