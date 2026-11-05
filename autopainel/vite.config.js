import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Duas páginas: o site e a Política de Privacidade (/privacidade).
    rollupOptions: { input: { main: 'index.html', privacidade: 'privacidade.html' } },
  },
});
