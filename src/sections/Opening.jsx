import { useEffect, useRef, useState } from 'react';
import { CONFIG, ctaHref } from '../config';
import DashTool from './app/DashTool';
import './Opening.css';

/* Largura em que o painel é desenhado antes de ser reduzido para caber na coluna
   (menor no celular, para o texto continuar legível). */
const shotWidth = (w) => (w < 560 ? 620 : 1040);

/** Print vivo do painel: o Dashboard roda com dados de demonstração, só para ver. */
function HeroShot() {
  const box = useRef(null);
  const inner = useRef(null);
  const [fit, setFit] = useState({ w: 1040, k: 0.5, h: 300 });
  useEffect(() => {
    const measure = () => {
      const w = shotWidth(box.current.clientWidth);
      const k = box.current.clientWidth / w;
      setFit({ w, k, h: inner.current.offsetHeight * k });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="hero-shot" ref={box} style={{ height: fit.h }} aria-hidden="true" inert="">
      <div className="hero-shot-in" ref={inner} style={{ width: fit.w, transform: `scale(${fit.k})` }}>
        <DashTool />
      </div>
    </div>
  );
}

export default function Opening() {
  return (
    <section id="topo" className="open" aria-labelledby="open-title">
      <div className="hero-split">
        <div className="hero-copy">
          <p className="hero-pill load-in" style={{ '--d': '0ms' }}>
            <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
          </p>
          <h1 id="open-title" className="open-title">
            <span className="mask load-mask" style={{ '--d': '20ms' }}>
              <span>Menos tempo no sistema.</span>
            </span>
            <span className="mask load-mask dim" style={{ '--d': '55ms' }}>
              <span>Mais carro vendido.</span>
            </span>
          </h1>
          <p className="open-sub load-in" style={{ '--d': '105ms' }}>
            Anúncio em 8 canais, aviso para o vendedor quando chega o carro que o cliente pediu e o preço
            máximo de compra pela placa.
          </p>
          <div className="hero-btns load-in" style={{ '--d': '150ms' }}>
            <a className="btn btn-accent btn-lg" href={ctaHref('trial')}>
              {CONFIG.ctas.trial.label} <span aria-hidden="true">→</span>
            </a>
            <a className="btn btn-ghost btn-lg" href="#app">
              Testar o painel aqui
            </a>
          </div>
          <p className="hero-note load-in" style={{ '--d': '190ms' }}>
            Plano mensal sem fidelidade · Plano anual a partir de R$ 87/mês
          </p>
        </div>
        <div className="hero-visual load-in" style={{ '--d': '125ms' }}>
          <HeroShot />
        </div>
      </div>
    </section>
  );
}
