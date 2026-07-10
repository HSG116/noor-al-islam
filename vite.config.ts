import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api/reels': 'http://localhost:8787',
        '/reels-media': 'http://localhost:8787',
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['motion'],
            ui: ['lucide-react'],
            supabase: ['@supabase/supabase-js'],
          }
        }
      }
    }
  };
});