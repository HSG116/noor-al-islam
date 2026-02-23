import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // استخدام رابط نسبي ليعمل على GitHub Pages (في مجلد) وعلى Vercel (في الرابط الرئيسي)
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
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
      // لضمان عدم حدوث مشاكل في الصور والملفات
      emptyOutDir: true
    }
  };
});