import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 700 },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
} as never);
