import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // `/showcase` and `/shop/*` are client routes; dev and preview fall back to index.html.
  appType: 'spa',
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
