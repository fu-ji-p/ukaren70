import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at https://<user>.github.io/<repository-name>/ .
// The Actions workflow passes VITE_BASE=/<repository-name>/ ; local dev uses '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
