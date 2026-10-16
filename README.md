# AutoPainel — Landing page

Landing page de vendas do AutoPainel, sistema para revendas de seminovos. Feita em React 18 + Vite, sem bibliotecas de animação.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # gera dist/
npm run lint
```

## Onde mudar o quê

- `src/config.js`: textos da oferta, preços, condições de cobrança, valores iniciais da calculadora e **destinos dos botões** (`ctas.trial.href`, `ctas.contact.href`). Enquanto um destino for `null`, o botão leva à seção de planos.
- `src/sections/`: uma seção por arquivo (abertura, publicação, CRM, calculadora, operação, oferta).
- `src/scrollEngine.js`: motor de rolagem. Passa o progresso das cenas fixas para o CSS (`data-r`, `data-o`, `data-at`).
- `src/autopainel.css`: estilos e animações. Com movimento reduzido ativado, a página vira uma página estática comum.

Integrações com marketplaces, FIPE e dados de mercado aparecem só como demonstração ilustrativa.
