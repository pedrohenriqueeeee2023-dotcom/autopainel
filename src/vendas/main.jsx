import '../styles/base.css';
import './vendas.css';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CONFIG, FAQ_ITEMS, ctaHref } from '../config';
import { initAnalytics } from '../analytics';
import Footer from '../sections/Footer';
import CookieBanner from '../CookieBanner';

/* Página de vendas no formato "vitrine escura": fundo profundo, brilho azul,
   textos grandes que andam com a rolagem e cartões de vidro. Mesma marca e
   mesmos textos do site (src/config.js). */

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

const FLOATERS = [
  'R$ 89.900',
  'FIPE −4,2%',
  'RIO2A18',
  '+12 leads',
  'R$ 64.500',
  'QWE1J23',
  '+8 canais',
  'R$ 112.000',
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

const ROLES = [
  ['Sócio', 'Margem por carro, giro do estoque e o resultado da loja num olhar.', 'r1'],
  ['Gerente', 'Estoque parado, metas da equipe e avaliações de compra pendentes.', 'r2'],
  ['Vendedor', 'Leads do dia, retornos agendados e carros compatíveis com cada cliente.', 'r3'],
  ['Financeiro', 'Custos de preparação, comissões e o que entrou e saiu em cada venda.', 'r4'],
];

const WHY = [
  ['Compra sem achismo', 'A calculadora mostra até quanto pagar antes de você fechar a troca.', 'calc'],
  ['8 canais de uma vez', 'Um cadastro, oito anúncios. Mudou o preço, muda em todos.', 'grid'],
  ['Nenhum lead esquecido', 'Todo contato fica no CRM, com histórico e próximo passo.', 'chat'],
  ['A gente configura', 'Raio-X grátis e onboarding feito pela nossa equipe.', 'spark'],
];

const DAYS = [
  ['Dia 1', 'Você cria a conta em um minuto, sem cartão.'],
  ['Dia 2', 'A equipe faz o Raio-X grátis da sua loja.'],
  ['Dia 3', 'Onboarding: a gente cadastra a loja, os carros e os vendedores.'],
  ['Dia 7', 'Você já comprou, anunciou e atendeu com o painel no dia a dia.'],
];

/* ---------------------------------------------------------------- efeitos */

/** Entradas ao rolar (.in) e progresso de rolagem (--p, 0→1) em [data-scroll]. */
function useScrollFx(root) {
  useEffect(() => {
    const el = root.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = el.querySelectorAll('[data-in]');
    let io = null;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((n) => n.classList.add('in'));
    } else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          }),
        { rootMargin: '0px 0px -12% 0px' },
      );
      items.forEach((n) => io.observe(n));
    }

    const scrollers = [...el.querySelectorAll('[data-scroll]')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = innerHeight;
      for (const n of scrollers) {
        const r = n.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        n.style.setProperty('--p', p.toFixed(4));
      }
    };
    const onScroll = () => raf || (raf = requestAnimationFrame(update));
    if (!reduce) {
      update();
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
    }
    return () => {
      io?.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root]);
}

/** Conta de 0 até `to` quando entra na tela. */
function Counter({ to, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(to);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1600);
        setN(Math.round(to * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

function Cta({ kind = 'trial', className = '', children }) {
  return (
    <a
      className={`v-btn ${kind === 'trial' ? 'v-btn-main' : 'v-btn-line'} ${className}`}
      href={ctaHref(kind)}
      target="_blank"
      rel="noreferrer"
    >
      {children || CONFIG.ctas[kind].label}
      {kind === 'trial' && (
        <span className="v-btn-dot" aria-hidden="true">
          →
        </span>
      )}
    </a>
  );
}

function Icon({ name }) {
  const paths = {
    calc: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    chat: 'M4 5h16v11H9l-5 4z M8 10h8',
    spark: 'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

/* ---------------------------------------------------------------- seções */

function Nav() {
  return (
    <header className="v-nav">
      <a className="v-logo" href="#topo" aria-label={`${CONFIG.brand.name} — início`}>
        <span className="ap-logo-mark" aria-hidden="true" />
        {CONFIG.brand.name}
      </a>
      <nav className="v-links" aria-label="Seções">
        <a href="#como">Como funciona</a>
        <a href="#perfis">Perfis</a>
        <a href="#teste">Teste</a>
        <a href="#duvidas">Dúvidas</a>
      </nav>
      <div className="v-nav-ctas">
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
    <section id="topo" className="v-hero" aria-labelledby="hero-title">
      <div className="v-beam" aria-hidden="true" />
      <div className="v-floaters" aria-hidden="true">
        {FLOATERS.map((f, i) => (
          <span key={f} style={{ '--i': i }}>
            {f}
          </span>
        ))}
      </div>
      <p className="v-chip v-rise">
        <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
      </p>
      <h1 id="hero-title" className="v-hero-title">
        <span className="v-rise" style={{ '--d': '120ms' }}>
          Sem achismo na compra.
        </span>
        <span className="v-rise v-grad" style={{ '--d': '260ms' }}>
          Domine o seu estoque.
        </span>
      </h1>
      <ul className="v-hero-pills v-rise" style={{ '--d': '400ms' }}>
        <li>Calculadora pela placa</li>
        <li>Anúncio em 8 canais</li>
        <li>CRM de leads</li>
      </ul>
      <div className="v-hero-ctas v-rise" style={{ '--d': '520ms' }}>
        <Cta />
        <Cta kind="contact" />
      </div>
    </section>
  );
}

function Stats() {
  const s = CONFIG.proof.stats;
  return (
    <section className="v-stats" aria-label="Números do AutoPainel">
      <div className="v-stats-grid">
        {s.map((st, i) => (
          <div key={st.label} className="v-stat" data-in style={{ '--d': `${i * 120}ms` }}>
            <strong>
              <Counter to={st.value} suffix="+" />
            </strong>
            <span>{st.label}</span>
          </div>
        ))}
        <div className="v-stat" data-in style={{ '--d': '360ms' }}>
          <strong>
            <Counter to={8} />
          </strong>
          <span>canais de anúncio integrados</span>
        </div>
        <span className="v-stats-line" aria-hidden="true" />
      </div>
      {CONFIG.proof.example && <p className="v-note">Números de exemplo.</p>}
    </section>
  );
}

function Slide({ children, reverse }) {
  return (
    <div className={`v-slide${reverse ? ' rev' : ''}`} data-scroll aria-hidden="true">
      <p>{children}</p>
    </div>
  );
}

function Capital() {
  return (
    <section className="v-capital" aria-labelledby="capital-title">
      <div className="v-capital-in">
        <h2 id="capital-title" className="v-capital-title" data-in>
          <span>Sua loja.</span>
          <span className="v-grad">Seu lucro.</span>
          <i className="v-spark" aria-hidden="true" />
        </h2>
        <div className="v-capital-text" data-in style={{ '--d': '150ms' }}>
          <span className="v-tag">Por que existe</span>
          <h3>Compre certo, anuncie em todo lugar e não perca nenhum cliente.</h3>
          <p>
            A revenda que roda em planilha e WhatsApp paga caro na troca, cadastra o mesmo carro em quatro
            sites e esquece o cliente que pediu um SUV. O AutoPainel junta compra, anúncio e atendimento num
            painel só, configurado pela nossa equipe.
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

function StartSelling() {
  return (
    <section className="v-start" aria-labelledby="start-title">
      <div className="v-start-copy" data-in>
        <h2 id="start-title">
          Pare de perder lead no WhatsApp. <span className="v-grad">Comece a vender</span> com o painel certo.
        </h2>
        <div className="v-hero-ctas">
          <Cta>Começar agora</Cta>
          <Cta kind="contact">Tirar dúvida</Cta>
        </div>
      </div>
      <div className="v-start-stack" data-scroll aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={{ '--i': i }}>
            Comece a vender
          </span>
        ))}
        <i className="v-helix" />
      </div>
    </section>
  );
}

function StepCard({ type }) {
  if (type === 'eval')
    return (
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
    );
  if (type === 'pub')
    return (
      <div className="v-card v-card-pub">
        <p className="v-card-k">Publicação · Toyota Corolla XEi 2022</p>
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
  );
}

function How() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 5000);
    return () => clearInterval(t);
  }, [auto]);
  return (
    <section id="como" className="v-how" aria-labelledby="how-title">
      <div className="v-head" data-in>
        <h2 id="how-title">
          Como <span className="v-grad">funciona?</span>
        </h2>
        <p>Da troca ao carro vendido, em três passos.</p>
      </div>
      <div className="v-stage" data-in style={{ '--d': '150ms' }}>
        <svg className="v-wave" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 220 C 180 120, 320 300, 520 170 S 760 80, 800 120 L800 300 L0 300 Z" />
          <path d="M0 250 C 200 170, 360 290, 540 200 S 760 130, 800 160" className="v-wave-line" />
        </svg>
        <div className="v-stage-card" key={step}>
          <StepCard type={STEPS[step].card} />
        </div>
      </div>
      <div className="v-steps" role="tablist" aria-label="Passos">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            aria-selected={i === step}
            className={i === step ? 'on' : ''}
            onClick={() => {
              setStep(i);
              setAuto(false);
            }}
          >
            <span className="v-steps-bar">
              <i style={{ animationPlayState: auto ? 'running' : 'paused' }} key={step} />
            </span>
            <span className="v-steps-n">Passo {i + 1}</span>
            <strong>{s.title}</strong>
            <span className="v-steps-t">{s.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="perfis" className="v-roles" aria-labelledby="roles-title">
      <div className="v-head" data-in>
        <h2 id="roles-title">
          Um painel para <span className="v-grad">cada função</span>
        </h2>
        <p>Cada perfil vê o que importa para o próprio trabalho.</p>
      </div>
      <ul className="v-roles-row">
        {ROLES.map(([t, d, art], i) => (
          <li key={t} className="v-role" data-in style={{ '--d': `${i * 110}ms` }}>
            <div className={`v-role-art ${art}`} aria-hidden="true">
              <i />
            </div>
            <h3>{t}</h3>
            <p>{d}</p>
            <a href={ctaHref('trial')} target="_blank" rel="noreferrer">
              Ver no teste <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Planet() {
  return (
    <section className="v-planet" aria-labelledby="planet-title">
      <span className="v-tag" data-in>
        Feito para revendas de seminovos
      </span>
      <h2 id="planet-title" data-in style={{ '--d': '120ms' }}>
        Revendas de <span className="v-grad">todo o Brasil</span> já compram, anunciam e vendem com o
        AutoPainel
      </h2>
      <div className="v-orb" data-scroll aria-hidden="true" />
    </section>
  );
}

function Why() {
  return (
    <section className="v-why" aria-labelledby="why-title">
      <div className="v-head" data-in>
        <h2 id="why-title">
          Por que o <span className="v-grad">AutoPainel?</span>
        </h2>
      </div>
      <div className="v-why-grid">
        {WHY.map(([t, d, ic], i) => (
          <article key={t} className="v-why-card" data-in style={{ '--d': `${i * 100}ms` }}>
            <span className="v-why-ico">
              <Icon name={ic} />
            </span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  const [day, setDay] = useState(DAYS.length - 1);
  return (
    <section id="teste" className="v-time" aria-labelledby="time-title">
      <div className="v-head" data-in>
        <h2 id="time-title">
          Sua loja rodando no painel em <span className="v-grad">7 dias</span>
        </h2>
      </div>
      <div className="v-time-box" data-in style={{ '--d': '150ms' }}>
        <div className="v-time-copy">
          <span className="v-tag">Teste grátis</span>
          {DAYS.map(([d, t], i) => (
            <p key={d} className={i === day ? 'on' : i < day ? 'past' : ''}>
              <strong>{d}:</strong> {t}
            </p>
          ))}
          <Cta>{CONFIG.ctas.trial.label}</Cta>
        </div>
        <div className="v-chart" role="group" aria-label="Dias do teste">
          <span className="v-chart-grid" aria-hidden="true" />
          {DAYS.map(([d], i) => (
            <button
              key={d}
              className={`v-pin${i <= day ? ' on' : ''}`}
              style={{ '--x': `${12 + i * 25}%`, '--h': `${18 + i * 22}%` }}
              onClick={() => setDay(i)}
              onMouseEnter={() => setDay(i)}
              aria-pressed={i === day}
            >
              <span className="v-pin-label">{d}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Join() {
  return (
    <section className="v-join" aria-labelledby="join-title">
      <span className="v-join-logo ap-logo-mark" aria-hidden="true" data-in />
      <h2 id="join-title" data-in style={{ '--d': '100ms' }}>
        Comece hoje a vender mais com o AutoPainel
      </h2>
      <p data-in style={{ '--d': '180ms' }}>
        Raio-X grátis, onboarding feito pela equipe e 7 dias para ver o painel funcionando na sua loja.
      </p>
      <div className="v-hero-ctas" data-in style={{ '--d': '260ms' }}>
        <Cta />
        <Cta kind="contact" />
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="duvidas" className="v-faq" aria-labelledby="faq-title">
      <div className="v-head" data-in>
        <h2 id="faq-title">
          Respostas às <span className="v-grad">dúvidas mais comuns</span>
        </h2>
      </div>
      <div className="v-faq-list" data-in style={{ '--d': '120ms' }}>
        {FAQ_ITEMS.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AllInOne() {
  const bars = [38, 52, 44, 61, 57, 70, 66, 82, 74, 90, 86, 97];
  return (
    <section className="v-all" aria-labelledby="all-title">
      <div className="v-head" data-in>
        <span className="v-tag">Painel AutoPainel</span>
        <h2 id="all-title">
          Tudo em <span className="v-grad">um só lugar</span>
        </h2>
        <p>Estoque, avaliações, anúncios e leads. Do celular ou do computador.</p>
      </div>
      <div className="v-dash" data-in style={{ '--d': '150ms' }} aria-hidden="true">
        <div className="v-dash-side">
          <span className="ap-logo-mark" />
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={i === 0 ? 'on' : ''} />
          ))}
        </div>
        <div className="v-dash-main">
          <div className="v-dash-kpis">
            <div>
              <span>Carros no estoque</span>
              <strong>42</strong>
            </div>
            <div>
              <span>Leads no mês</span>
              <strong>318</strong>
            </div>
            <div className="hi">
              <span>Margem média</span>
              <strong>R$ 9.840</strong>
            </div>
          </div>
          <div className="v-dash-chart">
            {bars.map((h, i) => (
              <i key={i} style={{ '--h': `${h}%`, '--i': i }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Voices() {
  const t = CONFIG.proof.testimonials;
  return (
    <section className="v-voices" aria-labelledby="voices-title">
      <div className="v-head" data-in>
        <h2 id="voices-title">
          Quem usa, <span className="v-grad">conta</span>
        </h2>
        {CONFIG.proof.example && <p className="v-note">Depoimentos de exemplo.</p>}
      </div>
      <div className="v-voices-grid">
        {t.map((x, i) => (
          <figure key={x.name} className="v-voice" data-in style={{ '--d': `${i * 110}ms` }}>
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
        ))}
      </div>
    </section>
  );
}

function Talk() {
  return (
    <section className="v-talk" aria-labelledby="talk-title">
      <div className="v-talk-big" data-scroll aria-hidden="true">
        <p>Vamos conversar · Vamos conversar · Vamos conversar ·</p>
      </div>
      <div className="v-talk-glass" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <h2 id="talk-title" data-in>
        Fale com a equipe no WhatsApp
      </h2>
      <p data-in style={{ '--d': '100ms' }}>
        Tire dúvidas, peça o Raio-X grátis e combine o onboarding da sua loja.
      </p>
      <div data-in style={{ '--d': '180ms' }}>
        <Cta kind="contact">Chamar no WhatsApp</Cta>
      </div>
    </section>
  );
}

function Vendas() {
  const ref = useRef(null);
  useScrollFx(ref);
  useEffect(() => initAnalytics(), []);
  return (
    <div className="ap v" ref={ref}>
      <a className="ap-skip" href="#teste">
        Pular para o teste grátis
      </a>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Slide>Pare de pagar caro na troca · Pare de pagar caro na troca ·</Slide>
        <Capital />
        <StartSelling />
        <How />
        <Slide reverse>Raio-X grátis · Onboarding pela equipe · Raio-X grátis ·</Slide>
        <Roles />
        <Planet />
        <Why />
        <Timeline />
        <Join />
        <Faq />
        <AllInOne />
        <Voices />
        <Talk />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Vendas />);
