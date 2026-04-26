import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Speaking Buddy',
          short_name: 'Speaking',
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
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
