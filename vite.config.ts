import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Perfil de escuela activo (build-time). Crear una escuela nueva = añadir
// `profiles/<slug>/` y construir con PROFILE=<slug>.
const PROFILE = process.env.PROFILE ?? 'escuela';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@profile': fileURLToPath(new URL(`./profiles/${PROFILE}`, import.meta.url)),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Agrupa las dependencias de terceros en chunks separados y cacheables,
          // así no se redescargan cuando cambia el código de la app.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    }
  };
})