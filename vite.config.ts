import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base so the same build works on GitHub Pages (/darts-game/) and locally.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  // three.js is big on its own (it loads separately, after the page), so don't warn about it.
  build: { chunkSizeWarningLimit: 700 },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
