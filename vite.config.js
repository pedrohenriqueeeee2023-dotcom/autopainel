import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Páginas: o site, a Política de Privacidade (/privacidade) e o painel BelezaPro (/belezapro).
    rollupOptions: { input: { main: 'index.html', privacidade: 'privacidade.html', belezapro: 'belezapro/index.html' } },
  },
});
