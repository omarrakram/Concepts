import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // `/showcase` and `/shop/*` are client routes; dev and preview fall back to index.html.
  appType: 'spa',
  // React + GSAP (ScrollTrigger, Draggable, Inertia, Flip) ≈ 170 kB gzipped in one chunk; /showcase is split out.
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 600 },
});
