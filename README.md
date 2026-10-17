# AutoPainel — Landing page

Landing page de vendas do AutoPainel, sistema para revendas de seminovos. Feita em React 18 + Vite, sem bibliotecas de animação.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # gera dist/
npm run lint
```

## Onde mudar o quê

- `src/config.js`: textos da oferta, preços, **destinos dos botões** (`ctas.trial.href`, `ctas.contact.href`) e a seção de prova (`proof`). Enquanto um destino for `null`, o botão leva à seção de planos. `proof.example: true` mostra o aviso de dados de exemplo; troque números e depoimentos pelos reais e mude para `false`.
- `src/sections/`: uma seção por arquivo, cada uma com o seu CSS ao lado (`Solved.jsx` + `Solved.css`).
- `src/sections/app/`: a mini versão do painel usada na abertura e na seção "Teste o painel aqui mesmo". Cada ferramenta (`PubTool`, `CrmTool`, `EvalTool`, `StockTool`) tem o próprio CSS.
- `src/styles/base.css`: cores, fontes, botões, cabeçalho e as regras de entrada (`data-reveal`, `data-build`).

## Como a página carrega

- O primeiro carregamento traz só o cabeçalho, a abertura e a mini versão do painel.
- As outras seções ficam em `<Defer>` (`src/Defer.jsx`). Cada uma baixa o seu JS e CSS quando chega perto da tela (900px antes). Até lá, um espaço reservado segura a altura.
- As abas do painel baixam a ferramenta na hora do clique, ou já ao passar o mouse.
- Um link interno (`#planos`, `#app`) carrega tudo o que falta antes de rolar até o destino (`src/smoothScroll.js`).
- `src/reveal.js` cuida das entradas ao rolar e observa as seções que chegam depois.
- `src/pointerFx.js` cuida dos efeitos de mouse: brilho, inclinação dos cartões e botões magnéticos.
- Com movimento reduzido ativado, todas as entradas aparecem prontas e os efeitos de mouse ficam desligados.

## Métricas (GA4)

Cole o ID de métrica em `CONFIG.analytics.ga4Id` (`src/config.js`). Com o ID preenchido, `src/analytics.js` carrega o GA4 e envia `clique_teste_gratis`, `clique_whatsapp` e `ver_secao`, todos com o parâmetro `secao`. Para ver `secao` nos relatórios, registre-o como dimensão personalizada no GA4 (Admin > Definições personalizadas).

## Publicação

O `vercel.json` está configurado para Vite (`npm run build`, saída em `dist/`). Com o repositório ligado à Vercel, cada push gera um preview e o merge na `main` publica em produção.

Integrações com marketplaces, FIPE e dados de mercado aparecem só como demonstração ilustrativa.
