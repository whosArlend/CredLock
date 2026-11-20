import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'zxcvbn-vendor': [
            '@zxcvbn-ts/core',
            '@zxcvbn-ts/language-common',
            '@zxcvbn-ts/language-en',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: true,
  },
});
