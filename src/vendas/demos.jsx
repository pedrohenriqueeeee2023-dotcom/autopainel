import { useEffect, useState } from 'react';
import { reduceMotion } from './fx';
import './demos.css';

/* Demonstrações animadas do "Como funciona": cada uma mostra, em poucos
   segundos, o que acontece no painel naquele passo. Começam quando o passo
   fica ativo na tela e voltam ao início quando ele sai. Com "reduzir
   movimento", aparecem prontas. São ilustração: o texto do passo ao lado
   explica o mesmo para quem usa leitor de tela. */

/** Fase da demonstração: vai de 0 até delays.length, esperando delays[i] antes da fase i + 1. */
function usePhase(on, delays) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!on) {
      setPhase(0);
      return;
    }
    if (reduceMotion()) {
      setPhase(delays.length);
      return;
    }
    let i = 0;
    let t = 0;
    const next = () => {
      if (i >= delays.length) return;
      t = setTimeout(() => {
        i += 1;
        setPhase(i);
        next();
      }, delays[i]);
    };
    setPhase(0);
    next();
    return () => clearTimeout(t);
  }, [on, delays]);
  return phase;
}

/** Texto digitado letra por letra enquanto `run`. */
function useTyping(text, run, ms) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) {
      setN(0);
      return;
    }
    if (reduceMotion()) {
      setN(text.length);
      return;
    }
    let k = 0;
    setN(0);
    const t = setInterval(() => {
      k += 1;
      setN(k);
      if (k >= text.length) clearInterval(t);
    }, ms);
    return () => clearInterval(t);
  }, [text, run, ms]);
  return text.slice(0, n);
}

/** Número que conta até `to` quando `run`. */
function useCountTo(to, run, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) {
      setV(0);
      return;
    }
    if (reduceMotion()) {
      setV(to);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(to * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return v;
}

const brl = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
const on = (cond) => (cond ? ' is-on' : '');

/** Janela no visual do painel (claro), com o nome da tela na barra. */
function Win({ title, children }) {
  return (
    <div className="dm">
      <div className="dm-bar">
        <i />
        <i />
        <i />
        <span>AutoPainel · {title}</span>
      </div>
      <div className="dm-body">{children}</div>
    </div>
  );
}

/* Passo 1: digita a placa, o painel consulta e mostra até quanto pagar.
   Fases: 0 campo vazio, 1 digitando, 2 consultando, 3 carro, 4–7 linhas, 8 resultado. */
const EVAL_DELAYS = [600, 1100, 1000, 550, 420, 420, 420, 520];

export function EvalDemo({ active }) {
  const ph = usePhase(active, EVAL_DELAYS);
  const plate = useTyping('RIO2A18', active && ph >= 1, 130);
  const pay = useCountTo(110500, ph >= 8);
  return (
    <Win title="Avaliação de compra">
      <div className="dm-eval">
        <div className="dm-eval-main">
          <div className="dm-field">
            <span>Placa do carro na troca</span>
            <span className="dm-plate">
              <small>BRASIL</small>
              <b>
                {plate}
                <i className={`dm-caret${ph >= 2 ? ' is-off' : ''}`} />
              </b>
            </span>
          </div>
          {/* "Consultando…" aparece no lugar onde o carro vai surgir. */}
          <div className="dm-slot">
            <p className={`dm-loading${on(ph === 2)}`}>
              <i /> Consultando FIPE e anúncios parecidos…
            </p>
            <div className={`dm-car${on(ph >= 3)}`}>
              <strong>Jeep Compass Longitude 2021</strong>
              <span>Preto · 48.200 km · Flex</span>
            </div>
          </div>
          <dl className="dm-rows">
            <div className={on(ph >= 4)}>
              <dt>FIPE (referência)</dt>
              <dd>R$ 128.400</dd>
            </div>
            <div className={on(ph >= 5)}>
              <dt>Anúncios parecidos (3)</dt>
              <dd>média R$ 131.300</dd>
            </div>
            <div className={on(ph >= 6)}>
              <dt>Preparação e documentos</dt>
              <dd className="neg">− R$ 4.200</dd>
            </div>
            <div className={on(ph >= 7)}>
              <dt>Sua margem</dt>
              <dd className="neg">− R$ 13.700</dd>
            </div>
          </dl>
        </div>
        <div className={`dm-result${on(ph >= 8)}`}>
          <span>Pague até</span>
          <strong>{brl(pay)}</strong>
          <em>✓ Dentro da sua margem</em>
        </div>
      </div>
    </Win>
  );
}

/* Passo 2: um clique publica o carro nos 8 canais.
   Fases: 0 cursor indo ao botão, 1 clique, 2–9 cada canal no ar, 10 aviso. */
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
const PUB_DELAYS = [1200, 450, 280, 280, 280, 280, 280, 280, 280, 280, 350];

function CarArt() {
  return (
    <svg className="dm-carart" viewBox="0 0 320 150" aria-hidden="true">
      <defs>
        <linearGradient id="dm-car-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dfe7f2" />
          <stop offset="1" stopColor="#9fb0c8" />
        </linearGradient>
      </defs>
      <rect width="320" height="150" rx="14" fill="#e9f0f9" />
      <path
        d="M40 104c0-12 6-18 18-21l38-8 34-24c8-6 18-9 28-9h52c12 0 22 4 30 11l26 22 22 4c14 3 22 10 22 22v8H40z"
        fill="url(#dm-car-body)"
      />
      <path d="M140 55c6-5 12-7 20-7h40c9 0 16 3 22 8l20 18H112z" fill="#5f7896" />
      <circle cx="100" cy="114" r="20" fill="#24364f" />
      <circle cx="100" cy="114" r="9" fill="#c5d2e3" />
      <circle cx="242" cy="114" r="20" fill="#24364f" />
      <circle cx="242" cy="114" r="9" fill="#c5d2e3" />
    </svg>
  );
}

export function PubDemo({ active }) {
  const ph = usePhase(active, PUB_DELAYS);
  const live = Math.max(0, Math.min(CHANNELS.length, ph - 1));
  return (
    <Win title="Publicação">
      <div className="dm-pub">
        <div className="dm-carcard">
          <CarArt />
          <strong>Toyota Corolla XEi 2022</strong>
          <span>R$ 128.900 · 38.200 km · Prata</span>
          <span className={`dm-btn${ph >= 1 ? ' is-pressed' : ''}`}>
            Publicar em 8 canais
            <i className={`dm-cursor${active && ph === 0 ? ' is-go' : ''}${ph >= 1 ? ' is-there' : ''}`} />
          </span>
        </div>
        <div className="dm-channels">
          <p className="dm-progress">
            <b>{live}/8</b> canais no ar
            <span>
              <i style={{ width: `${(live / CHANNELS.length) * 100}%` }} />
            </span>
          </p>
          <ul>
            {CHANNELS.map((c, i) => (
              <li key={c} className={i < live ? 'is-live' : ph >= 1 ? 'is-sending' : ''}>
                <span>{c}</span>
                <em>{i < live ? 'No ar' : ph >= 1 ? 'Enviando…' : 'Aguardando'}</em>
              </li>
            ))}
          </ul>
          <p className={`dm-toast${on(ph >= 10)}`}>✓ Anúncio no ar em 8 canais</p>
        </div>
      </div>
    </Win>
  );
}

/* Passo 3: chega um lead, o painel acha um carro compatível e o vendedor avisa.
   Fases: 0 lista, 1 novo lead, 2 ficha, 3 carro compatível, 4 clique, 5 mensagem, 6 enviada. */
const CRM_DELAYS = [700, 900, 900, 1000, 600, 3300];
const MSG = 'Oi, Marina! Chegou um Jeep Compass 2021 que combina com o que você procura. Quer ver hoje?';

export function CrmDemo({ active }) {
  const ph = usePhase(active, CRM_DELAYS);
  const msg = useTyping(MSG, active && ph >= 5, 30);
  return (
    <Win title="CRM e vendas">
      <div className="dm-crm">
        <div className="dm-leads">
          <p className="dm-h">Leads de hoje</p>
          <ul>
            <li className={`dm-lead is-new${on(ph >= 1)}`}>
              <span className="dm-ava">M</span>
              <span>
                <strong>Marina S.</strong>
                WhatsApp · agora
              </span>
              <em className={ph >= 6 ? 'is-deal' : ''}>{ph >= 6 ? 'Em negociação' : 'Novo'}</em>
            </li>
            <li className="dm-lead">
              <span className="dm-ava">C</span>
              <span>
                <strong>Carlos T.</strong>
                Pediu fotos do HR-V
              </span>
              <em>Retornar 15h</em>
            </li>
            <li className="dm-lead">
              <span className="dm-ava">P</span>
              <span>
                <strong>Paula R.</strong>
                Troca + financiamento
              </span>
              <em>Avaliação</em>
            </li>
          </ul>
        </div>
        <div className={`dm-detail${on(ph >= 2)}`}>
          <p className="dm-h">Marina S.</p>
          <p className="dm-need">
            Procura: <b>SUV até R$ 120 mil</b>
          </p>
          <div className={`dm-match${on(ph >= 3)}`}>
            <span className="dm-badge">Compatível</span>
            <strong>Jeep Compass Longitude 2021</strong>
            <span>R$ 118.900 · chegou hoje no estoque</span>
          </div>
          <span className={`dm-btn dm-wa${ph >= 4 ? ' is-pressed' : ''}`}>Avisar no WhatsApp</span>
          <div className={`dm-chat${on(ph >= 5)}`}>
            <p>
              {msg}
              {ph === 5 && <i className="dm-caret" />}
            </p>
            <em className={on(ph >= 6)}>Enviado ✓</em>
          </div>
        </div>
      </div>
    </Win>
  );
}
