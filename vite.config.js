import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Três páginas: o site, a página de vendas (/vendas) e a Política de Privacidade (/privacidade).
    rollupOptions: { input: { main: 'index.html', privacidade: 'privacidade.html', vendas: 'vendas.html' } },
  },
});
