import { useEffect, useState } from 'react';
import { ctaHref } from '../config';
import './Opening.css';

/* Abertura centralizada sobre a foto de um pátio de revenda. O visual conta o
   produto num relance: a placa é digitada e vira o preço máximo de compra. */

// Foto gratuita do Unsplash (licença Unsplash).
const PHOTO = 'https://images.unsplash.com/photo-1574023240744-64c47c8c0676?auto=format&fit=crop&q=60';
const PLATE = 'ABC1D23';
const PRICE = 79323;
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

export default function Opening() {
  const { plate, price, done } = usePlateDemo();

  return (
    <section id="topo" className="open" aria-labelledby="open-title">
      <img
        className="open-bg"
        src={`${PHOTO}&w=1600`}
        srcSet={`${PHOTO}&w=800 800w, ${PHOTO}&w=1600 1600w, ${PHOTO}&w=2400 2400w`}
        sizes="100vw"
        alt=""
        fetchPriority="high"
      />

      <div className="open-in">
        <h1 id="open-title" className="open-title">
          <span className="mask load-mask" style={{ '--d': '20ms' }}>
            <span>Pare de pagar</span>
          </span>
          <span className="mask load-mask" style={{ '--d': '90ms' }}>
            <span>
              <em className="kw">caro</em> na troca.
            </span>
          </span>
        </h1>

        <div
          className="open-demo load-in"
          style={{ '--d': '200ms' }}
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
            →
          </span>
          <div className={`open-price ${done ? 'is-on' : ''}`} aria-hidden="true">
            <span>Pague no máximo</span>
            <strong>{brl(price)}</strong>
          </div>
        </div>

        <a
          className="btn btn-accent btn-lg open-cta load-in"
          style={{ '--d': '320ms' }}
          href={ctaHref('trial')}
          target="_blank"
          rel="noreferrer"
        >
          Testar 7 dias grátis <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
