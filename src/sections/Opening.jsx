import { useEffect, useState } from 'react';
import { ctaHref } from '../config';
import './Opening.css';

/* Abertura em dois lados. Esquerda: chamada, título e botão. Direita: uma tela
   do app em que a placa é digitada e vira o preço máximo, com os cartões das
   outras ferramentas embaixo. */

const PLATE = 'ABC1D23';
const PRICE = 79323;
const KINDS = ['carros', 'motos', 'ônibus', 'caminhões'];
const brl = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

/** Placa digitada letra a letra e, depois, o preço contando até o valor final. */
function usePlateDemo() {
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [typed, setTyped] = useState(still ? PLATE.length : 0);
  const [price, setPrice] = useState(still ? PRICE : 0);

  useEffect(() => {
    if (still) return undefined;
    let raf = 0;
    const timers = [...PLATE].map((_, i) => setTimeout(() => setTyped(i + 1), 700 + i * 110));
    timers.push(
      setTimeout(
        () => {
          const t0 = performance.now();
          const step = (t) => {
            const k = Math.min(1, (t - t0) / 900);
            setPrice(PRICE * (1 - (1 - k) ** 3));
            if (k < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        },
        700 + PLATE.length * 110 + 350,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [still]);

  return { plate: PLATE.slice(0, typed), price, done: price > 0 };
}

/** Palavra que troca sozinha a cada 2,2 s. */
function useRotate(list, ms = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % list.length), ms);
    return () => clearInterval(id);
  }, [list, ms]);
  return list[i];
}

/* Ícones dos cartões flutuantes (traço simples, herdam a cor). */
const ICONS = {
  pub: 'M4 10v4h3l6 4V6L7 10H4zm13-1a4 4 0 0 1 0 6',
  crm: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zm4 10a2 2 0 0 0 4 0',
  stock: 'M3 13l2-6h14l2 6v5h-3v-2H6v2H3zm3-1h12',
  fin: 'M4 19V9m6 10V5m6 14v-7m4 7H2',
};
function Chip({ ico, children, className, d }) {
  return (
    <div className={`open-chip ${className}`} style={{ '--cd': d }} aria-hidden="true">
      <span className="open-chip-ico">
        <svg viewBox="0 0 24 24">
          <path d={ICONS[ico]} />
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function Opening() {
  const { plate, price, done } = usePlateDemo();
  const kind = useRotate(KINDS);

  return (
    <section id="topo" className="open" aria-labelledby="open-title">
      <span className="open-grid" aria-hidden="true" />
      <span className="open-glow open-glow-a" aria-hidden="true" />
      <span className="open-glow open-glow-b" aria-hidden="true" />

      <div className="open-split">
        <div className="open-copy">
          <p className="open-eyebrow load-in" style={{ '--d': '0ms' }}>
            Transforme a gestão da sua loja de{' '}
            <span className="open-kind" aria-live="polite">
              <span key={kind}>{kind}</span>
            </span>
          </p>
          <h1 id="open-title" className="open-title">
            <span className="mask load-mask" style={{ '--d': '40ms' }}>
              <span>Lojista, pare</span>
            </span>
            <span className="mask load-mask" style={{ '--d': '90ms' }}>
              <span>
                de pagar <em className="kw">caro</em>
              </span>
            </span>
            <span className="mask load-mask" style={{ '--d': '140ms' }}>
              <span>na compra!</span>
            </span>
          </h1>
          <a
            className="btn btn-accent btn-lg open-cta load-in"
            style={{ '--d': '240ms' }}
            href={ctaHref('trial')}
            target="_blank"
            rel="noreferrer"
          >
            Testar 7 dias grátis <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="open-app load-in" style={{ '--d': '160ms' }}>
          <div
            className="open-demo"
            role="img"
            aria-label={`Exemplo: placa ${PLATE}, pague no máximo ${brl(PRICE)}`}
          >
            <div className="plate" aria-hidden="true">
              <span className="plate-band">
                BRASIL
                <i />
              </span>
              <span className="plate-num">
                {plate}
                {!done && <b className="plate-caret" />}
              </span>
            </div>
            <span className={`open-arrow ${done ? 'is-on' : ''}`} aria-hidden="true">
              ↓
            </span>
            <div className={`open-price ${done ? 'is-on' : ''}`} aria-hidden="true">
              <span>Pague no máximo</span>
              <strong>{brl(price)}</strong>
            </div>
          </div>

          <div className="open-chips">
            <Chip ico="pub" className="c1" d="1.6s">
              Publicado em <b>8 canais</b>
            </Chip>
            <Chip ico="crm" className="c2" d="1.75s">
              Novo lead: <b>Corolla</b>
            </Chip>
            <Chip ico="stock" className="c3" d="1.9s">
              <b>32</b> no estoque
            </Chip>
            <Chip ico="fin" className="c4" d="2.05s">
              Comissões <b>em dia</b>
            </Chip>
          </div>
        </div>
      </div>
    </section>
  );
}
