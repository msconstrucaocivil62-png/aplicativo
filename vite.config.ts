import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': projectRoot },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
    hmr: false,
    watch: { usePolling: true, interval: 500 },
  },
});
