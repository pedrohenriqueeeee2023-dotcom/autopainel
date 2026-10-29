import '../styles/base.css';
import './vendas.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CONFIG, FAQ_ITEMS, ctaHref } from '../config';
import { initAnalytics } from '../analytics';
import { initPointerFx } from '../pointerFx';
import Footer from '../sections/Footer';
import PhotoBand from '../PhotoBand';
import CookieBanner from '../CookieBanner';
import {
  initAccordion,
  initCurtains,
  initMarquees,
  initReveal,
  initScrollVars,
  initScrollGuide,
  initSectionTracker,
  initSpotlight,
  reduceMotion,
  scrollToProgress,
  useAutoStep,
  useInView,
  usePinMode,
  useScrollProgress,
} from './fx';
import { Corners, Counter, Cta, G, GridFx, Marquee, Meteors, Sparks, Split, Words } from './parts';
import { CrmDemo, EvalDemo, PubDemo } from './demos';
import printSocio from '../assets/prints/socio.jpg';
import printGerente from '../assets/prints/gerente.jpg';
import printVendedor from '../assets/prints/vendedor.jpg';
import printFinanceiro from '../assets/prints/financeiro.jpg';

/* Página de vendas no formato "vitrine escura": fundo profundo, brilho azul,
   grade fina com linhas de luz, títulos que entram letra por letra, seções
   que ficam presas enquanto o conteúdo troca. Mesma marca e mesmos textos do
   site (src/config.js). Os efeitos ficam em fx.js e as peças em parts.jsx. */

const CHANNELS = [
  'OLX',
  'Mercado Livre',
  'Site da loja',
  'Tray',
  'Nuvemshop',
  'Shopify',
  'WooCommerce',
  'Loja Integrada',
];

/* Valores que flutuam na abertura: [texto, x %, y %, giro]. Os 4 primeiros
   ficam nos cantos porque são os únicos que aparecem no celular. */
const FLOATERS = [
  ['R$ 89.900', 5, 15, -8],
  ['FIPE −4,2%', 74, 12, 6],
  ['RIO2A18', 8, 88, 5],
  ['+12 leads', 72, 90, -6],
  ['R$ 64.500', 90, 36, 9],
  ['QWE1J23', 2, 58, -5],
  ['+8 canais', 89, 70, -9],
  ['R$ 112.000', 24, 22, 7],
];

const STEPS = [
  {
    title: 'Digite a placa',
    text: 'O painel mostra a FIPE e anúncios parecidos, desconta seus custos e a sua margem e diz até quanto pagar.',
    Demo: EvalDemo,
  },
  {
    title: 'Anuncie uma vez',
    text: 'Cadastre o carro uma vez só. O anúncio sai na OLX, no Mercado Livre, no site da loja e em mais 5 canais.',
    Demo: PubDemo,
  },
  {
    title: 'Atenda no CRM',
    text: 'Cada contato vira um lead com histórico. O painel avisa quando entra um carro compatível com o que o cliente procura.',
    Demo: CrmDemo,
  },
];

/* Perfis: a tela que cada um usa no dia a dia (prints da versão de
   demonstração do painel, em src/assets/prints; troque por prints do sistema
   com os mesmos nomes) e a cor do fundo quando o perfil está na frente. */
const ROLES = [
  {
    name: 'Sócio',
    screen: 'Dashboard',
    text: 'Vê a loja inteira num painel só, com todas as áreas no menu lateral.',
    points: ['Faturamento e lucro do mês', 'Valor do estoque', 'Meta de cada vendedor'],
    print: printSocio,
    // No celular mostra um recorte ampliado (o do sócio com o menu lateral).
    pos: '0% 0',
    h: 634,
    alt: 'Tela do Dashboard do AutoPainel com menu lateral, faturamento do mês, veículos disponíveis, valor em estoque, lucro médio por veículo e metas por vendedor.',
    tint: 'rgba(127, 214, 255, 0.22)',
  },
  {
    name: 'Gerente',
    screen: 'Estoque',
    text: 'Cuida do pátio: preço, status, dias parado e anúncios de cada carro.',
    points: ['Busca por marca, modelo ou placa', 'Carros parados há mais tempo', 'Anúncios ativos por carro'],
    print: printGerente,
    pos: '38% 0',
    h: 581,
    alt: 'Tela de Estoque do AutoPainel com busca, filtros por status e a lista de carros com placa, quilometragem, preço, status, dias de pátio e anúncios.',
    tint: 'rgba(0, 118, 229, 0.3)',
  },
  {
    name: 'Vendedor',
    screen: 'Calculadora de compra',
    text: 'Digita a placa do carro da troca e já sabe até quanto pagar.',
    points: ['FIPE e anúncios parecidos', 'Custos e margem descontados', 'Preço máximo de compra'],
    print: printVendedor,
    pos: '67% 0',
    h: 809,
    alt: 'Tela da Calculadora de compra do AutoPainel com a placa do veículo, dados do carro, referências de mercado, custos e margem e o preço máximo recomendado de compra.',
    tint: 'rgba(63, 212, 134, 0.2)',
  },
  {
    name: 'Financeiro',
    screen: 'Financeiro',
    text: 'Acompanha o que entra e sai em cada venda, sem planilha.',
    points: ['Saldo, a receber e a pagar', 'Comissões do mês', 'Lançamentos por venda'],
    print: printFinanceiro,
    pos: '48% 0',
    h: 700,
    alt: 'Tela Financeiro do AutoPainel com saldo em caixa, valores a receber e a pagar, comissões do mês e a lista de lançamentos.',
    tint: 'rgba(198, 212, 234, 0.2)',
  },
];

const WHY = [
  ['Compra sem achismo', 'A calculadora mostra até quanto pagar antes de você fechar a troca.', 'chart'],
  ['8 canais de uma vez', 'Um cadastro, oito anúncios. Mudou o preço, muda em todos.', 'channels'],
  ['Nenhum lead esquecido', 'Todo contato fica no CRM, com histórico e próximo passo.', 'chat'],
  ['A gente configura', 'Raio-X grátis e onboarding feito pela nossa equipe.', 'check'],
];

/* Linha do gráfico do cartão "Compra sem achismo": o ponto brilhante corre por ela. */
const CHART_PATH = 'M8 82C40 76 58 80 84 62S128 50 150 54 196 42 232 38';

const XRAY = [
  ['Raio-X', 'Raio-X: a equipe analisa a sua loja e mostra onde você perde dinheiro. Sem custo.'],
  ['Onboarding', 'Onboarding: a gente cadastra a loja, os carros e os vendedores para você.'],
];

/* Indicador lateral: [id da seção, nome]. Nas seções presas mostra os passos. */
const RAIL = [
  ['topo', 'Início'],
  ['numeros', 'Números'],
  ['loja', 'Sua loja'],
  ['como', 'Como funciona'],
  ['raio-x', 'Raio-X'],
  ['perfis', 'Perfis'],
  ['brasil', 'Revendas'],
  ['por-que', 'Por que'],
  ['depoimentos', 'Depoimentos'],
  ['duvidas', 'Dúvidas'],
  ['contato', 'Contato'],
];

function Rail() {
  const [cur, setCur] = useState({ id: 'topo', step: 0, n: 0 });
  useEffect(() => {
    const on = (e) => setCur(e.detail);
    document.addEventListener('v-guide', on);
    return () => document.removeEventListener('v-guide', on);
  }, []);
  return (
    <nav className="v-rail" aria-label="Seções da página">
      {RAIL.map(([id, label]) => {
        const on = cur.id === id;
        return (
          <a key={id} href={`#${id}`} className={on ? 'on' : ''} aria-current={on ? 'true' : undefined}>
            <span className="v-rail-label">
              {label}
              {on && cur.n > 0 && (
                <em>
                  {' '}
                  {cur.step + 1}/{cur.n}
                </em>
              )}
            </span>
            <span className="v-rail-dot" aria-hidden="true">
              {on &&
                cur.n > 0 &&
                Array.from({ length: cur.n }, (_, k) => <b key={k} className={k <= cur.step ? 'on' : ''} />)}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/* ---------------------------------------------------------------- seções */

function Nav() {
  const links = [
    ['#como', 'Como funciona'],
    ['#perfis', 'Perfis'],
    ['#depoimentos', 'Depoimentos'],
    ['#duvidas', 'Dúvidas'],
  ];
  return (
    <header className="v-nav">
      <a className="v-logo v-drop" href="#topo" aria-label={`${CONFIG.brand.name} — início`}>
        <span className="ap-logo-mark" aria-hidden="true" />
        {CONFIG.brand.name}
      </a>
      <nav className="v-links" aria-label="Seções">
        {links.map(([href, label], i) => (
          <a key={href} className="v-drop" href={href} style={{ '--d': `${120 + i * 70}ms` }}>
            {label}
          </a>
        ))}
      </nav>
      <div className="v-nav-ctas v-drop" style={{ '--d': '420ms' }}>
        <Cta kind="contact" className="v-hide-sm">
          WhatsApp
        </Cta>
        <Cta>Testar 7 dias</Cta>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="topo" className="v-hero v-iso" data-snap="" aria-labelledby="hero-title">
      <div className="v-beam" aria-hidden="true" />
      <Sparks n={28} seed={5} className="v-hero-sparks" />
      <div className="v-floaters" aria-hidden="true">
        {FLOATERS.map(([f, x, y, r], i) => (
          <span key={f} style={{ '--i': i, '--x': `${x}%`, '--y': `${y}%`, '--r': `${r}deg` }}>
            {f}
          </span>
        ))}
      </div>
      <div className="v-hero-main">
        <p className="v-chip v-rise" style={{ '--d': '150ms' }}>
          <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
        </p>
        <h1 id="hero-title" className="v-hero-title" data-in="own">
          <span className="v-line">
            <Split step={26}>Sem achismo na compra.</Split>
          </span>
          <span className="v-line">
            <Split step={26} start={20}>
              <G>Domine o seu estoque.</G>
            </Split>
          </span>
        </h1>
        <ul className="v-hero-pills v-rise" style={{ '--d': '1100ms' }}>
          <li>Calculadora pela placa</li>
          <li>Anúncio em 8 canais</li>
          <li>CRM de leads</li>
        </ul>
        <div className="v-hero-ctas v-rise" style={{ '--d': '1250ms' }}>
          <Cta />
          <Cta kind="contact" />
        </div>
      </div>
      <a className="v-hint" href="#numeros">
        <span className="v-hint-mouse" aria-hidden="true">
          <i />
        </span>
        Role para ver
      </a>
    </section>
  );
}

function Stats() {
  const items = [
    ...CONFIG.proof.stats.map((s) => ({ ...s, suffix: '+' })),
    { label: 'canais de anúncio integrados', value: 8, suffix: '' },
  ];
  return (
    <section id="numeros" className="v-stats v-iso" data-snap="" aria-label="Números do AutoPainel">
      <div className="v-stats-field" data-scroll>
        <span className="v-cross" data-in="own" aria-hidden="true">
          <i className="v-cross-v" />
          <i className="v-cross-h" />
          <b />
        </span>
        {items.map((st, i) => (
          <div key={st.label} className={`v-stat s${i}`} data-in style={{ '--d': `${i * 140}ms` }}>
            <strong>
              <Counter to={st.value} suffix={st.suffix} />
            </strong>
            <span>{st.label}</span>
          </div>
        ))}
      </div>
      {CONFIG.proof.example && <p className="v-note">Números de exemplo.</p>}
    </section>
  );
}

function Capital() {
  return (
    <section id="loja" className="v-capital" data-snap="" aria-labelledby="capital-title">
      <div className="v-capital-in">
        <h2 id="capital-title" className="v-capital-title" data-in="own">
          <span className="v-line">
            <Split step={34}>Sua loja.</Split>
          </span>
          <span className="v-line">
            <Split step={34} start={8}>
              <G>Seu lucro.</G>
            </Split>
          </span>
          <i className="v-spark" aria-hidden="true" />
        </h2>
        <div className="v-capital-text">
          <span className="v-tag" data-in>
            Por que existe
          </span>
          <h3 data-in="own">
            <Words>Compre certo, anuncie em todo lugar e não perca nenhum cliente.</Words>
          </h3>
          <p data-in="own" style={{ '--d': '350ms' }}>
            <Words step={9}>
              A revenda que roda em planilha e WhatsApp paga caro na troca, cadastra o mesmo carro em quatro
              sites e esquece o cliente que pediu um SUV. O AutoPainel junta compra, anúncio e atendimento num
              painel só, configurado pela nossa equipe.
            </Words>
          </p>
        </div>
      </div>
      <div className="v-ticker" aria-label="Canais integrados">
        <div className="v-ticker-track">
          {[...CHANNELS, ...CHANNELS].map((c, i) => (
            <span key={i} aria-hidden={i >= CHANNELS.length || undefined}>
              <i /> {c} <em>integrado</em>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Onda do fundo: um período de 800 desenhado duas vezes, para andar sem emenda. */
function wave(base, amp, phase) {
  let d = '';
  for (let x = 0; x <= 1600; x += 20) {
    const y =
      base +
      amp * Math.sin((2 * Math.PI * x) / 800 + phase) +
      amp * 0.4 * Math.sin((4 * Math.PI * x) / 800 + phase * 2);
    d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
  }
  return d;
}
const WAVES = [
  [210, 34, 0, '14s'],
  [235, 26, 1.7, '20s'],
  [255, 20, 3.1, '26s'],
];

function Waves() {
  return (
    <svg className="v-waves" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="v-wave-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00a3ec" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0076e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {WAVES.map(([base, amp, phase, t], i) => {
        const line = wave(base, amp, phase);
        return (
          <g key={i} style={{ '--t': t }}>
            <path className="v-wave-fill" d={`${line}L1600 300L0 300Z`} />
            <path className="v-wave-line" d={line} />
          </g>
        );
      })}
    </svg>
  );
}

function How({ pin }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const seen = useInView(stageRef);
  const onProgress = useCallback((p) => {
    setStep(Math.round(p * (STEPS.length - 1)));
  }, []);
  useScrollProgress(ref, pin, onProgress);
  // Sem a seção presa, troca sozinho depois de a demonstração terminar.
  useAutoStep(!pin && auto && seen, STEPS.length, 9000, setStep);

  // A demonstração de cada passo diminui o que for preciso para caber inteira
  // na área (telas baixas, prévia dentro de outra página).
  useEffect(() => {
    const stage = stageRef.current;
    // Cada janela tem a própria medida: a mais alta não diminui as outras.
    const fit = () =>
      stage.querySelectorAll('.v-stage-card').forEach((card) => {
        const c = card.firstElementChild;
        if (!c?.offsetWidth || !c.offsetHeight) return;
        const k = Math.min(
          1,
          (stage.clientWidth - 32) / c.offsetWidth,
          (stage.clientHeight - 48) / c.offsetHeight,
        );
        card.style.setProperty('--fit', Math.max(0.45, k).toFixed(3));
      });
    // Mede de novo quando a área muda ou quando uma janela muda de tamanho
    // (as fontes terminam de carregar, por exemplo).
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    stage.querySelectorAll('.v-stage-card > *').forEach((c) => ro.observe(c));
    fit();
    return () => ro.disconnect();
  }, []);

  const choose = (i) => {
    if (pin) return scrollToProgress(ref.current, i / (STEPS.length - 1));
    setStep(i);
    setAuto(false);
  };

  return (
    <section
      id="como"
      ref={ref}
      data-snap=""
      data-lock={pin ? STEPS.length : undefined}
      className={`v-how v-iso${pin ? ' is-pin' : ''}${auto && !pin ? ' is-auto' : ''}`}
      aria-labelledby="how-title"
    >
      <GridFx seed={3} runners={3} />
      <div className="v-how-in">
        <div className="v-head v-how-head">
          <h2 id="how-title" data-in="own">
            <Split>
              Como <G>funciona?</G>
            </Split>
          </h2>
          <p data-in="own" style={{ '--d': '300ms' }}>
            <Words>Da troca ao carro vendido, em três passos.</Words>
          </p>
        </div>
        <div className="v-how-grid">
          <div className="v-steps" role="tablist" aria-label="Passos">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === step}
                className={i === step ? 'on' : i < step ? 'done' : ''}
                onClick={() => choose(i)}
              >
                <span className="v-steps-n">{String(i + 1).padStart(2, '0')}</span>
                <strong>{s.title}</strong>
                <span className="v-steps-t">{s.text}</span>
                <span className="v-steps-bar" aria-hidden="true">
                  <i key={i === step ? step : 'x'} />
                </span>
              </button>
            ))}
            {/* No celular os botões viram só barras; o texto do passo atual fica aqui. */}
            <p className="v-steps-detail" aria-hidden="true">
              <strong>{STEPS[step].title}</strong>
              {STEPS[step].text}
            </p>
          </div>
          <div className="v-stage" ref={stageRef} data-in>
            <Corners />
            <Waves />
            {STEPS.map(({ title, Demo }, i) => (
              <div key={title} className={`v-stage-card${i === step ? ' on' : ''}`} aria-hidden="true">
                <Demo active={seen && i === step} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function XRay({ pin }) {
  const ref = useRef(null);
  const [phase, setPhase] = useState(0);
  const [auto, setAuto] = useState(true);
  const onProgress = useCallback((p) => {
    setPhase(Math.round(p));
    ref.current.style.setProperty('--xp', p.toFixed(3));
  }, []);
  useScrollProgress(ref, pin, onProgress);
  useAutoStep(!pin && auto, 2, 4500, setPhase);
  const choose = (i) => {
    if (pin) return scrollToProgress(ref.current, i);
    setPhase(i);
    setAuto(false);
  };

  return (
    <section
      id="raio-x"
      ref={ref}
      className={`v-xray v-iso${pin ? ' is-pin' : ''}`}
      style={pin ? undefined : { '--xp': phase }}
      data-snap=""
      data-lock={pin ? 2 : undefined}
      aria-labelledby="xray-title"
    >
      <h2 id="xray-title" className="v-sr">
        Raio-X grátis e onboarding feito pela equipe
      </h2>
      <div className="v-xray-in">
        <div className={`v-xray-stage ph${phase}`}>
          {XRAY.map(([word], i) => (
            <button
              key={word}
              type="button"
              className={`v-xray-word ${i ? 'b' : 'a'}${phase === i ? ' on' : ''}`}
              aria-pressed={phase === i}
              onClick={() => choose(i)}
            >
              {word}
            </button>
          ))}
          <div className="v-xray-card-wrap" aria-hidden="true">
            <Sparks n={16} seed={9} className="v-xray-sparks" />
            <div className="v-xray-card">
              <div className={`v-face${phase === 0 ? ' on' : ''}`}>
                <p className="v-face-head">
                  <span className="ap-logo-mark" /> Raio-X da sua loja <em>Grátis</em>
                </p>
                <dl>
                  <div>
                    <dt>Carros parados há mais de 60 dias</dt>
                    <dd>9</dd>
                  </div>
                  <div>
                    <dt>Leads sem resposta</dt>
                    <dd>23</dd>
                  </div>
                  <div>
                    <dt>Margem média por carro</dt>
                    <dd>R$ 7.900</dd>
                  </div>
                </dl>
                <p className="v-face-foot">Feito pela equipe AutoPainel</p>
              </div>
              <div className={`v-face${phase === 1 ? ' on' : ''}`}>
                <p className="v-face-head">
                  <span className="ap-logo-mark" /> Onboarding <em>Pela equipe</em>
                </p>
                <ul className="v-face-list">
                  {[
                    'Loja cadastrada',
                    '42 carros importados',
                    '4 vendedores com acesso',
                    '8 canais conectados',
                  ].map((t, i) => (
                    <li key={t} style={{ '--i': i }}>
                      <svg viewBox="0 0 24 24">
                        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
                      </svg>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="v-face-foot">Sua loja pronta para o teste de 7 dias</p>
              </div>
            </div>
          </div>
        </div>
        <div className="v-xray-caps">
          {XRAY.map(([word, cap], i) => (
            <p key={word} className={phase === i ? 'on' : ''}>
              {cap}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles({ pin }) {
  const ref = useRef(null);
  // Perto da seção, as imagens deixam de esperar e carregam todas.
  const near = useInView(ref, '150% 0px');
  const viewRef = useRef(null);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const place = useCallback((pos) => {
    const track = trackRef.current;
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const x = (viewRef.current.clientWidth - card.offsetWidth) / 2 - pos * (card.offsetWidth + gap);
    track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
  }, []);
  const onProgress = useCallback(
    (p) => {
      const pos = p * (ROLES.length - 1);
      place(pos);
      setActive(Math.round(pos));
    },
    [place],
  );
  useScrollProgress(ref, pin, onProgress);
  useAutoStep(!pin && !reduceMotion(), ROLES.length, 3500, setActive);
  useEffect(() => {
    if (pin) return;
    const onResize = () => place(active);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pin, active, place]);

  const choose = (i) => {
    if (pin) scrollToProgress(ref.current, i / (ROLES.length - 1));
    else setActive(i);
  };

  return (
    <section
      id="perfis"
      ref={ref}
      data-snap=""
      data-lock={pin ? ROLES.length : undefined}
      className={`v-roles v-iso${pin ? ' is-pin' : ''}`}
      style={{ '--tint': ROLES[active].tint }}
      aria-labelledby="roles-title"
    >
      <div className="v-roles-in">
        <div className="v-head">
          <h2 id="roles-title" data-in="own">
            <Split>
              Um painel para <G>cada função</G>
            </Split>
          </h2>
          <p data-in="own" style={{ '--d': '300ms' }}>
            <Words>Cada perfil vê o que importa para o próprio trabalho.</Words>
          </p>
        </div>
        <div className="v-roles-view" ref={viewRef}>
          <ul className="v-roles-track" ref={trackRef}>
            {ROLES.map((r, i) => (
              <li
                key={r.name}
                className={`v-role${i === active ? ' on' : ''}`}
                data-spot=""
                onClick={() => i !== active && choose(i)}
              >
                <div className="v-role-copy">
                  <span className="v-role-k">Tela: {r.screen}</span>
                  <h3>{r.name}</h3>
                  <p>{r.text}</p>
                  <ul className="v-role-points">
                    {r.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <a
                    href={ctaHref('trial')}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={i === active ? 0 : -1}
                  >
                    Ver no teste <span aria-hidden="true">→</span>
                  </a>
                </div>
                <figure className="v-role-print">
                  <img
                    src={r.print}
                    alt={r.alt}
                    width="1400"
                    height={r.h}
                    loading={near ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ '--pos': r.pos }}
                  />
                </figure>
              </li>
            ))}
          </ul>
        </div>
        <div className="v-roles-dots" role="group" aria-label="Escolher perfil">
          {ROLES.map(({ name: t }, i) => (
            <button
              key={t}
              type="button"
              className={i === active ? 'on' : ''}
              aria-pressed={i === active}
              onClick={() => choose(i)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Fim da condição especial: a data fixa de CONFIG.countdown.until ou, sem
 * ela, `minutes` depois da primeira visita da pessoa (guardada no navegador).
 */
function offerEnd({ until, minutes }) {
  if (until) return new Date(until).getTime();
  if (!minutes) return NaN;
  const now = Date.now();
  let start = now;
  try {
    const saved = Number(localStorage.getItem('ap-oferta-inicio'));
    if (saved > 0 && saved <= now) start = saved;
    else localStorage.setItem('ap-oferta-inicio', String(now));
  } catch {
    // Sem acesso ao armazenamento: conta a partir desta visita.
  }
  return start + minutes * 60000;
}

/** Tempo que falta, a cada segundo: [[valor, unidade], ...]. Acabou: null. */
function useCountdown(cfg) {
  const [end] = useState(() => offerEnd(cfg));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!(end > Date.now())) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!(end > now)) return null;
  const s = Math.floor((end - now) / 1000);
  const d = Math.floor(s / 86400);
  const parts = [
    [Math.floor(s / 3600) % 24, 'horas'],
    [Math.floor(s / 60) % 60, 'min'],
    [s % 60, 'seg'],
  ];
  return d ? [[d, 'dias'], ...parts] : parts;
}

function Planet() {
  const left = useCountdown(CONFIG.countdown);
  return (
    <section id="brasil" className="v-planet v-iso" data-snap="" aria-labelledby="planet-title">
      <Sparks n={34} seed={11} className="v-planet-sparks" />
      <Meteors n={5} seed={3} />
      <div className="v-planet-in">
        <span className="v-tag" data-in>
          Feito para revendas de seminovos
        </span>
        <h2 id="planet-title" data-in="own">
          <Split>
            Revendas de <G>todo o Brasil</G> já compram, anunciam e vendem com o AutoPainel
          </Split>
        </h2>
        {left && (
          <div className="v-count" data-in style={{ '--d': '600ms' }}>
            <p>{CONFIG.countdown.label}</p>
            <div className="v-count-digits" role="timer">
              {left.map(([v, u]) => (
                <span key={u}>
                  <b>{String(v).padStart(2, '0')}</b>
                  <small>{u}</small>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="v-hero-ctas" data-in style={{ '--d': '800ms' }}>
          <Cta />
          <Cta kind="contact" />
        </div>
      </div>
      {/* O planeta fica abaixo do texto: o brilho da borda nunca passa por trás dele. */}
      <div className="v-planet-ground" aria-hidden="true">
        <div className="v-orb" data-scroll />
      </div>
    </section>
  );
}

function WhyArt({ type }) {
  if (type === 'chart')
    return (
      <div className="v-art v-art-chart">
        <svg width="240" height="96" viewBox="0 0 240 96">
          <path className="v-art-grid" d="M0 24H240M0 48H240M0 72H240" />
          <path className="v-art-limit" d="M0 30H240" />
          <path className="v-art-line" d={CHART_PATH} pathLength="1" />
        </svg>
        <i className="v-art-dot" style={{ offsetPath: `path('${CHART_PATH}')` }} />
        <span className="v-art-label">até R$ 110 mil</span>
      </div>
    );
  if (type === 'channels')
    return (
      <div className="v-art v-art-ch">
        {['OLX', 'ML', 'Site', 'Tray', 'Nuvem', 'Shopify', 'Woo', 'Loja Int.'].map((c, i) => (
          <span key={c} style={{ '--i': i }}>
            {c}
          </span>
        ))}
      </div>
    );
  if (type === 'chat')
    return (
      <div className="v-art v-art-chat">
        <i style={{ '--i': 0 }}>Tem SUV até 120 mil?</i>
        <i className="me" style={{ '--i': 1 }}>
          Chegou um Compass 2021!
        </i>
        <i style={{ '--i': 2 }}>Posso ver amanhã?</i>
        <b>3</b>
      </div>
    );
  return (
    <ul className="v-art v-art-check">
      {['Raio-X da loja', 'Carros cadastrados', 'Equipe com acesso'].map((t, i) => (
        <li key={t} style={{ '--i': i }}>
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
          </svg>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Why() {
  return (
    <section id="por-que" className="v-why v-iso" data-snap="" aria-labelledby="why-title">
      <GridFx seed={7} runners={4} />
      <div className="v-head">
        <h2 id="why-title" data-in="own">
          <Split>
            Por que o <G>AutoPainel?</G>
          </Split>
        </h2>
      </div>
      <div className="v-why-grid">
        {WHY.map(([t, d, art], i) => (
          <article key={t} className="v-why-card" data-in data-spot="" style={{ '--d': `${i * 100}ms` }}>
            <WhyArt type={art} />
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Voice({ x, hidden }) {
  return (
    <figure className="v-voice" data-spot="" aria-hidden={hidden || undefined}>
      <span className="v-stars" aria-label="5 de 5 estrelas">
        ★★★★★
      </span>
      <blockquote>{x.text}</blockquote>
      <figcaption>
        <img src={x.photo} alt="" width="40" height="40" loading="lazy" />
        <span>
          <strong>{x.name}</strong>
          {x.role}
        </span>
      </figcaption>
    </figure>
  );
}

function Voices() {
  const { testimonials: t, rating, example } = CONFIG.proof;
  /* Cada faixa repete os depoimentos até passar da largura da tela; só a
     primeira cópia da primeira faixa é lida pelo leitor de tela. */
  const row = (list, readable) => {
    const half = [...list, ...list, ...list, ...list];
    return [...half, ...half].map((x, i) => <Voice key={i} x={x} hidden={!readable || i >= list.length} />);
  };
  return (
    <section id="depoimentos" className="v-voices" data-snap="" aria-labelledby="voices-title">
      <div className="v-head">
        <h2 id="voices-title" data-in="own">
          <Split>
            Quem usa, <G>conta</G>
          </Split>
        </h2>
        {rating && (
          <p className="v-rating" data-in style={{ '--d': '250ms' }}>
            <span aria-hidden="true">★★★★★</span> <strong>{rating.value}</strong> de 5 · {rating.count}{' '}
            avaliações
          </p>
        )}
        {example && <p className="v-note">Depoimentos e nota de exemplo.</p>}
      </div>
      <div className="v-voices-rows" data-in style={{ '--d': '200ms' }}>
        <div className="v-vrow">
          <div className="v-vtrack">{row(t, true)}</div>
        </div>
        <div className="v-vrow rev">
          <div className="v-vtrack">{row([t[1], t[2], t[0]], false)}</div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="duvidas" className="v-faq v-iso" data-snap="" aria-labelledby="faq-title">
      <GridFx seed={13} runners={4} />
      <div className="v-head">
        <h2 id="faq-title" data-in="own">
          <Split>
            Respostas às <G>dúvidas mais comuns</G>
          </Split>
        </h2>
      </div>
      <div className="v-faq-list" data-in style={{ '--d': '150ms' }}>
        {FAQ_ITEMS.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span aria-hidden="true" />
            </summary>
            <div className="v-faq-a">
              <p>{a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Talk() {
  return (
    <section id="contato" className="v-talk v-iso" data-snap="" aria-labelledby="talk-title">
      <GridFx seed={21} runners={3} />
      <Marquee text="Vamos conversar · " speed={0.8} className="v-talk-mq" />
      <h2 id="talk-title" data-in="own">
        <Split>Fale com a equipe no WhatsApp</Split>
      </h2>
      <p data-in="own" style={{ '--d': '400ms' }}>
        <Words>Tire dúvidas, peça o Raio-X grátis e comece o seu teste de 7 dias.</Words>
      </p>
      <div className="v-hero-ctas" data-in style={{ '--d': '600ms' }}>
        <Cta />
        <Cta kind="contact">Chamar no WhatsApp</Cta>
      </div>
    </section>
  );
}

function Vendas() {
  const ref = useRef(null);
  const pin = usePinMode();
  useEffect(() => initReveal(ref.current), []);
  useEffect(() => initScrollVars(ref.current), []);
  useEffect(() => initMarquees(ref.current), []);
  useEffect(() => initSpotlight(ref.current), []);
  useEffect(() => initAccordion(ref.current), []);
  useEffect(() => initPointerFx(ref.current), []);
  useEffect(() => initCurtains(ref.current), []);
  useEffect(() => initScrollGuide(ref.current), []);
  useEffect(() => initSectionTracker(ref.current), []);
  useEffect(() => initAnalytics(), []);
  return (
    <div className={`ap v${pin ? ' v-pin-on' : ''}`} ref={ref}>
      <a className="ap-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Nav />
      <Rail />
      <main id="conteudo">
        <div className="v-curtain">
          <Hero />
          <Stats />
        </div>
        <PhotoBand className="v-photo-mq">
          <Marquee text="Pare de pagar caro na troca · " curve className="v-mq-big" />
        </PhotoBand>
        <Capital />
        <How pin={pin} />
        <XRay pin={pin} />
        <Roles pin={pin} />
        <div className="v-curtain">
          <Planet />
          <Why />
        </div>
        <Marquee text="Teste 7 dias sem cartão · " curve className="v-mq-big" />
        <Voices />
        <Faq />
        <Talk />
      </main>
      <Footer />
      <CookieBanner />
      {import.meta.env.VITE_PREVIEW && <MotionNote />}
    </div>
  );
}

/**
 * Só na prévia (VITE_PREVIEW): avisa quando o aparelho está com "reduzir
 * movimento" ligado, que desliga de propósito os movimentos grandes.
 */
function MotionNote() {
  const [open, setOpen] = useState(reduceMotion);
  if (!open) return null;
  return (
    <div className="v-motion-note" role="status">
      <p>
        <strong>Seu aparelho está com “Reduzir movimento” ligado.</strong> Por acessibilidade, a página
        desliga os movimentos grandes. Para ver todos os efeitos, desligue a opção: iPhone em Ajustes ›
        Acessibilidade › Movimento; Android em Acessibilidade › Remover animações; Windows em Configurações ›
        Acessibilidade › Efeitos visuais.
      </p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Fechar aviso">
        ×
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Vendas />);
