import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode preview` builds a single self-contained HTML file that runs without the API
// (catalogue bundled in, orders and reviews kept in the browser). Used for shareable previews.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'preview' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
    fs: { allow: ['..'] },
  },
}));
