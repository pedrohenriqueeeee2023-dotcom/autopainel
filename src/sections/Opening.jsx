import { useEffect, useRef, useState } from 'react';
import { CONFIG, ctaHref } from '../config';
import EvalTool from './app/EvalTool';
import './Opening.css';

/* Largura em que o painel é desenhado antes de ser reduzido para caber na coluna
   (menor no celular, para o texto continuar legível). */
const shotWidth = (w) => (w < 560 ? 620 : 1040);

/** Print vivo da calculadora de compra, com dados de demonstração, só para ver. */
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
        <EvalTool />
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
              <span>Saiba até quanto pagar</span>
            </span>
            <span className="mask load-mask dim" style={{ '--d': '55ms' }}>
              <span>antes de comprar o carro.</span>
            </span>
          </h1>
          <p className="open-sub load-in" style={{ '--d': '105ms' }}>
            Digite a placa: a calculadora de compra compara a FIPE com anúncios parecidos, desconta custos e a
            sua margem e mostra o preço máximo. Junto vêm anúncio em 8 canais, CRM e estoque.
          </p>
          <div className="hero-btns load-in" style={{ '--d': '150ms' }}>
            <a className="btn btn-accent btn-lg" href={ctaHref('trial')} target="_blank" rel="noreferrer">
              {CONFIG.ctas.trial.label} <span aria-hidden="true">→</span>
            </a>
            <a className="btn btn-ghost btn-lg" href="#app">
              Testar a calculadora
            </a>
          </div>
          <p className="hero-note load-in" style={{ '--d': '190ms' }}>
            7 dias de teste · Raio-X grátis · Onboarding feito pela nossa equipe
          </p>
        </div>
        <div className="hero-visual load-in" style={{ '--d': '125ms' }}>
          <HeroShot />
        </div>
      </div>
    </section>
  );
}
