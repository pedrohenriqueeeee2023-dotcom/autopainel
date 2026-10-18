import { lazy, Suspense, useMemo, useState } from 'react';
import { AppNav } from './app/AppWindow';
import EvalTool from './app/EvalTool';
import './AppDemo.css';

// Cada ferramenta só baixa quando a aba dela é aberta (a calculadora já veio com a abertura).
const DashTool = lazy(() => import('./app/DashTool'));
const PubTool = lazy(() => import('./app/PubTool'));
const CrmTool = lazy(() => import('./app/CrmTool'));
const StockTool = lazy(() => import('./app/StockTool'));

/* Mini versão do painel para o visitante mexer. Cada aba abre uma ferramenta. */
const TOOLS = {
  pub: {
    tab: 'Publicação',
    lead: 'Cadastre uma vez e anuncie em OLX, Mercado Livre, no site da loja e em cinco lojas virtuais.',
    hint: 'Clique em Sincronizar tudo ou publique canal por canal.',
    el: () => <PubTool />,
  },
  crm: {
    tab: 'CRM',
    lead: 'Cada lead guarda o carro que o cliente procura. Quando um compatível chega, o card avisa o vendedor.',
    hint: 'Arraste os cards entre as etapas ou use a seta.',
    el: () => <CrmTool />,
  },
  eval: {
    tab: 'Calculadora de compra',
    lead: 'Digite a placa: o painel compara a FIPE com anúncios parecidos, desconta custos e margem e mostra até quanto pagar.',
    hint: 'Teste outra placa nos atalhos ou mude a margem.',
    el: () => <EvalTool />,
  },
  stock: {
    tab: 'Estoque',
    lead: 'Busque por marca, modelo ou placa e veja preço, status, dias de pátio e anúncios de cada carro.',
    hint: 'Filtre por status ou marque um carro como vendido.',
    el: () => <StockTool />,
  },
  dash: {
    tab: 'Painel',
    lead: 'Faturamento do mês, meta de cada vendedor e o que entra e sai do caixa.',
    hint: 'Troque para a aba Financeiro e filtre os lançamentos.',
    el: () => <DashTool />,
  },
  fin: {
    lead: 'Entradas, saídas e comissões do mês, com filtro por tipo de lançamento.',
    hint: 'Filtre entradas e saídas ou volte para o Dashboard.',
    el: () => <DashTool initialTab="fin" />,
  },
};
const TABS = ['eval', 'pub', 'crm', 'stock', 'dash'];
// Ao passar o mouse numa aba, a ferramenta já começa a baixar.
const PRELOAD = {
  pub: () => import('./app/PubTool'),
  crm: () => import('./app/CrmTool'),
  stock: () => import('./app/StockTool'),
  dash: () => import('./app/DashTool'),
};

export default function AppDemo() {
  const [tool, setTool] = useState('eval');
  const nav = useMemo(() => ({ go: setTool, has: (k) => k in TOOLS }), []);
  const t = TOOLS[tool];
  const tabOn = tool === 'fin' ? 'dash' : tool;

  return (
    <section id="app" className="demo" aria-labelledby="demo-title">
      <div className="demo-in">
        <div className="demo-head" data-reveal>
          <h2 id="demo-title" className="h2">
            <span className="mask">
              <span>Teste o painel</span>
            </span>
            <span className="mask dim" style={{ '--i': 1 }}>
              <span>aqui mesmo.</span>
            </span>
          </h2>
          <p className="lead">
            Uma versão reduzida do AutoPainel, com dados de demonstração. Clique, arraste e digite.
          </p>
        </div>

        <div className="demo-bar" data-reveal style={{ '--rd': '120ms' }}>
          <div className="demo-tabs" role="tablist" aria-label="Ferramentas do painel">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === tabOn}
                className={k === tabOn ? 'on' : ''}
                onClick={() => setTool(k)}
                onPointerEnter={() => PRELOAD[k]?.()}
              >
                {TOOLS[k].tab}
              </button>
            ))}
          </div>
          <div className="demo-copy" aria-live="polite">
            <p>{t.lead}</p>
            <p className="tool-hint">
              <span aria-hidden="true">↳</span> {t.hint}
            </p>
          </div>
        </div>

        <div className="demo-win" data-reveal style={{ '--rd': '220ms' }}>
          <AppNav.Provider value={nav}>
            <div key={tool} className="demo-pane">
              <Suspense fallback={<div className="demo-wait" />}>{t.el()}</Suspense>
            </div>
          </AppNav.Provider>
        </div>
      </div>
    </section>
  );
}
