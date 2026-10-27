import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Perfil de escuela activo (build-time). Crear una escuela nueva = añadir
// `profiles/<slug>/` y construir con PROFILE=<slug>.
const PROFILE = process.env.PROFILE ?? 'escuela';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    laravel({
      input: ['src/main.tsx'],
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@profile': fileURLToPath(new URL(`./profiles/${PROFILE}`, import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ['**/storage/framework/views/**'],
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Agrupa las dependencias de terceros en chunks separados y cacheables.
        manualChunks(id: string) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
        },
      },
    },
  },
});
