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
- `vendas.html` + `src/vendas/`: a página de vendas (`/vendas`), com a mesma marca e os mesmos textos de `src/config.js`. Tudo dela fica em `main.jsx` (seções) e `vendas.css`. As perguntas do FAQ (`FAQ_ITEMS`) ficam em `src/config.js` e servem às duas páginas.
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

A tag do GA4 (`G-R17LQ89M6L`) fica no `<head>` do `index.html`; para trocar de propriedade, mude o ID nas duas linhas dela. `src/analytics.js` envia os eventos abaixo (a lista completa com os parâmetros está no topo do arquivo):

| Evento | Quando | Parâmetros |
| --- | --- | --- |
| `clique_oferta` | Botões do teste de 7 dias (WhatsApp) | `secao`, `texto` |
| `clique_whatsapp` | Outros links do WhatsApp | `secao`, `texto` |
| `clique_navegacao` | Links internos (#app, #planos...) | `secao`, `texto`, `destino` |
| `ver_secao` | Primeira vez que a seção aparece | `secao` |
| `tempo_secao` | Ao sair: segundos de cada seção na tela | `secao`, `segundos` |
| `rolagem` | 25, 50, 75 e 100% da página | `percentual` |
| `abrir_faq` | Pergunta aberta no FAQ | `pergunta` |
| `abrir_aba_demo` | Aba do painel de teste | `aba` |
| `usar_calculadora` | Placa consultada na calculadora | `placa`, `origem` |
| `ajustar_custos` | Campo de custo/margem alterado | `campo` |
| `salvar_avaliacao` | Salvar avaliação na calculadora | `aba` |
| `interacao_demo` | Outros botões do painel de teste | `aba`, `acao` |

Para ver os parâmetros nos relatórios, registre cada um como dimensão personalizada no GA4 (Admin > Definições personalizadas; `segundos` e `percentual` como métricas). Marque `clique_oferta` como evento principal (conversão).

## Meta Pixel

A tag do Pixel fica no `<head>` do `index.html` e lê o ID da variável `VITE_META_PIXEL_ID` (Vercel > Settings > Environment Variables, depois um novo deploy). Sem a variável, o Pixel não carrega. Eventos: `PageView` ao abrir a página e `Lead` junto com `clique_oferta`.

## Publicação

O `vercel.json` está configurado para Vite (`npm run build`, saída em `dist/`). Com o repositório ligado à Vercel, cada push gera um preview e o merge na `main` publica em produção.

Integrações com marketplaces, FIPE e dados de mercado aparecem só como demonstração ilustrativa.
