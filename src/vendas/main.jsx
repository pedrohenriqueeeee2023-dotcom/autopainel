import '../styles/base.css';
import './vendas.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CONFIG, FAQ_ITEMS, ctaHref } from '../config';
import { initAnalytics } from '../analytics';
import { initPointerFx } from '../pointerFx';
import Footer from '../sections/Footer';
import CookieBanner from '../CookieBanner';
import {
  initAccordion,
  initMarquees,
  initReveal,
  initScrollVars,
  initSmoothWheel,
  initSpotlight,
  scrollToProgress,
  useAutoStep,
  usePinMode,
  useScrollProgress,
} from './fx';
import { Corners, Counter, Cta, G, GridFx, Marquee, Meteors, Sparks, Split, Words } from './parts';

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
    card: 'eval',
  },
  {
    title: 'Anuncie uma vez',
    text: 'Cadastre o carro uma vez só. O anúncio sai na OLX, no Mercado Livre, no site da loja e em mais 5 canais.',
    card: 'pub',
  },
  {
    title: 'Atenda no CRM',
    text: 'Cada contato vira um lead com histórico. O painel avisa quando entra um carro compatível com o que o cliente procura.',
    card: 'crm',
  },
];

/* [perfil, texto, cor do fundo quando o cartão está na frente] */
const ROLES = [
  [
    'Sócio',
    'Margem por carro, giro do estoque e o resultado da loja num olhar.',
    'rgba(127, 214, 255, 0.22)',
  ],
  ['Gerente', 'Estoque parado, metas da equipe e avaliações de compra pendentes.', 'rgba(0, 118, 229, 0.3)'],
  [
    'Vendedor',
    'Leads do dia, retornos agendados e carros compatíveis com cada cliente.',
    'rgba(63, 212, 134, 0.2)',
  ],
  [
    'Financeiro',
    'Custos de preparação, comissões e o que entrou e saiu em cada venda.',
    'rgba(198, 212, 234, 0.2)',
  ],
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
    <section id="topo" className="v-hero v-iso" aria-labelledby="hero-title">
      <div className="v-beam" aria-hidden="true" />
      <Sparks n={28} seed={5} className="v-hero-sparks" />
      <div className="v-floaters" aria-hidden="true">
        {FLOATERS.map(([f, x, y, r], i) => (
          <span key={f} style={{ '--i': i, '--x': `${x}%`, '--y': `${y}%`, '--r': `${r}deg` }}>
            {f}
          </span>
        ))}
      </div>
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
    </section>
  );
}

function Stats() {
  const items = [
    ...CONFIG.proof.stats.map((s) => ({ ...s, suffix: '+' })),
    { label: 'canais de anúncio integrados', value: 8, suffix: '' },
  ];
  return (
    <section className="v-stats v-iso" aria-label="Números do AutoPainel">
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
    <section className="v-capital" aria-labelledby="capital-title">
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

function StepCard({ type }) {
  if (type === 'eval')
    return (
      <div className="v-fan">
        <div className="v-card v-card-eval">
          <p className="v-card-k">Avaliação de compra</p>
          <p className="v-plate">RIO2A18</p>
          <p className="v-card-sub">Jeep Compass Longitude 2021</p>
          <dl>
            <div>
              <dt>FIPE</dt>
              <dd>R$ 128.400</dd>
            </div>
            <div>
              <dt>Custos + margem</dt>
              <dd>− R$ 17.900</dd>
            </div>
          </dl>
          <p className="v-card-big">
            Pague até <strong>R$ 110.500</strong>
          </p>
        </div>
      </div>
    );
  if (type === 'pub')
    return (
      <div className="v-card v-card-pub v-window">
        <p className="v-window-bar">
          <i />
          <i />
          <i />
          <span>Publicação · Toyota Corolla XEi 2022</span>
        </p>
        <ul>
          {CHANNELS.map((c, i) => (
            <li key={c} style={{ '--i': i }}>
              {c} <span>no ar</span>
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="v-phone">
      <div className="v-card v-card-crm">
        <p className="v-card-k">Leads de hoje</p>
        {[
          ['Marina S.', 'Procura SUV até R$ 120 mil', 'Compatível: Compass 2021'],
          ['Carlos T.', 'Pediu fotos do HR-V', 'Retornar 15h'],
          ['Paula R.', 'Troca + financiamento', 'Avaliação agendada'],
        ].map(([n, a, b], i) => (
          <div key={n} className="v-lead" style={{ '--i': i }}>
            <span className="v-avatar">{n[0]}</span>
            <div>
              <strong>{n}</strong>
              <span>{a}</span>
            </div>
            <em>{b}</em>
          </div>
        ))}
      </div>
    </div>
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
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const onProgress = useCallback((p) => {
    const s = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
    setStep(s);
    ref.current.style.setProperty('--sp', Math.min(1, p * STEPS.length - s).toFixed(3));
  }, []);
  useScrollProgress(ref, pin, onProgress);
  useAutoStep(!pin && auto, STEPS.length, 5000, setStep);

  const choose = (i) => {
    if (pin) return scrollToProgress(ref.current, (i + 0.5) / STEPS.length);
    setStep(i);
    setAuto(false);
  };

  return (
    <section
      id="como"
      ref={ref}
      className={`v-how v-iso${pin ? ' is-pin' : ''}${auto && !pin ? ' is-auto' : ''}`}
      aria-labelledby="how-title"
    >
      <GridFx seed={3} runners={3} />
      <div className="v-how-in">
        <div className="v-head">
          <h2 id="how-title" data-in="own">
            <Split>
              Como <G>funciona?</G>
            </Split>
          </h2>
          <p data-in="own" style={{ '--d': '300ms' }}>
            <Words>Da troca ao carro vendido, em três passos.</Words>
          </p>
        </div>
        <div className="v-stage" data-in>
          <Corners />
          <Waves />
          {STEPS.map((s, i) => (
            <div key={s.card} className={`v-stage-card${i === step ? ' on' : ''}`} aria-hidden={i !== step}>
              <StepCard type={s.card} />
            </div>
          ))}
        </div>
        <div className="v-steps" role="tablist" aria-label="Passos" style={{ '--step': step }}>
          <span className="v-steps-glow" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={i === step}
              className={i === step ? 'on' : i < step ? 'done' : ''}
              onClick={() => choose(i)}
            >
              <span className="v-steps-bar">
                <i key={i === step ? step : 'x'} />
              </span>
              <span className="v-steps-n">Passo {i + 1}</span>
              <strong>{s.title}</strong>
              <span className="v-steps-t">{s.text}</span>
            </button>
          ))}
          {/* No celular os botões viram só barras; o texto do passo atual fica aqui. */}
          <p className="v-steps-detail" aria-hidden="true">
            <strong>{STEPS[step].title}</strong>
            {STEPS[step].text}
          </p>
        </div>
      </div>
    </section>
  );
}

function XRay({ pin }) {
  const ref = useRef(null);
  const [phase, setPhase] = useState(0);
  const onProgress = useCallback((p) => setPhase(p < 0.5 ? 0 : 1), []);
  useScrollProgress(ref, pin, onProgress, 'view');
  useAutoStep(!pin, 2, 4500, setPhase);

  return (
    <section ref={ref} className="v-xray v-iso" data-scroll aria-labelledby="xray-title">
      <h2 id="xray-title" className="v-sr">
        Raio-X grátis e onboarding feito pela equipe
      </h2>
      <div className={`v-xray-stage ph${phase}`}>
        {XRAY.map(([word], i) => (
          <button
            key={word}
            type="button"
            className={`v-xray-word ${i ? 'b' : 'a'}${phase === i ? ' on' : ''}`}
            aria-pressed={phase === i}
            onClick={() => setPhase(i)}
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
    </section>
  );
}

function Circuit() {
  return (
    <svg className="v-circuit" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">
      {['M0 30H60L80 50H200', 'M0 92H40L60 72H124L144 92H200', 'M120 0V28L138 46V120'].map((d, k) => (
        <g key={d}>
          <path d={d} />
          <path className="flow" d={d} pathLength="244" style={{ '--k': k }} />
        </g>
      ))}
    </svg>
  );
}

function Roles({ pin }) {
  const ref = useRef(null);
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
  useAutoStep(!pin, ROLES.length, 3500, setActive);
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
      className={`v-roles v-iso${pin ? ' is-pin' : ''}`}
      style={{ '--tint': ROLES[active][2] }}
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
            {ROLES.map(([t, d], i) => (
              <li
                key={t}
                className={`v-role${i === active ? ' on' : ''}`}
                data-spot=""
                onClick={() => i !== active && choose(i)}
              >
                <div className={`v-role-art r${i + 1}`} aria-hidden="true">
                  <Circuit />
                  <i />
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
                <a href={ctaHref('trial')} target="_blank" rel="noreferrer" tabIndex={i === active ? 0 : -1}>
                  Ver no teste <span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="v-roles-dots" role="group" aria-label="Escolher perfil">
          {ROLES.map(([t], i) => (
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

/** Tempo até `until` (data ISO), atualizado a cada segundo. Sem data válida e futura: null. */
function useCountdown(until) {
  const end = until ? new Date(until).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!(end > Date.now())) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!(end > now)) return null;
  const s = Math.floor((end - now) / 1000);
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
}

function Planet() {
  const left = useCountdown(CONFIG.countdown.until);
  return (
    <section className="v-planet v-iso" aria-labelledby="planet-title">
      <Sparks n={34} seed={11} className="v-planet-sparks" />
      <Meteors n={5} seed={3} />
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
            {['dias', 'horas', 'min', 'seg'].map((u, i) => (
              <span key={u}>
                <b>{String(left[i]).padStart(2, '0')}</b>
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
      <div className="v-orb" data-scroll aria-hidden="true" />
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
    <section className="v-why v-iso" aria-labelledby="why-title">
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
    <section id="depoimentos" className="v-voices" aria-labelledby="voices-title">
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
    <section id="duvidas" className="v-faq v-iso" aria-labelledby="faq-title">
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
    <section className="v-talk v-iso" aria-labelledby="talk-title">
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
  useEffect(() => initSmoothWheel(), []);
  useEffect(() => initAnalytics(), []);
  return (
    <div className={`ap v${pin ? ' v-pin-on' : ''}`} ref={ref}>
      <a className="ap-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <div className="v-curtain">
          <Hero />
          <Stats />
        </div>
        <Marquee text="Pare de pagar caro na troca · " curve className="v-mq-big" />
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
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Vendas />);
