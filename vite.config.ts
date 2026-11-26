import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
