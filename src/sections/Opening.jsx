import { CONFIG, ctaHref } from '../config';
import './Opening.css';

/* Abertura: um título, uma linha e um número. O cartão mostra o resultado da
   calculadora para uma placa de exemplo (mesmos dados da demonstração). */
export default function Opening() {
  return (
    <section id="topo" className="open" aria-labelledby="open-title">
      <div className="hero-split">
        <div className="hero-copy">
          <h1 id="open-title" className="open-title">
            <span className="mask load-mask" style={{ '--d': '20ms' }}>
              <span>
                Pare de pagar <em className="kw">caro</em>
              </span>
            </span>
            <span className="mask load-mask" style={{ '--d': '55ms' }}>
              <span>na troca.</span>
            </span>
          </h1>
          <p className="open-sub load-in" style={{ '--d': '105ms' }}>
            Digite a placa e veja até quanto pagar.
          </p>
          <div className="hero-btns load-in" style={{ '--d': '150ms' }}>
            <a className="btn btn-accent btn-lg" href={ctaHref('trial')} target="_blank" rel="noreferrer">
              Testar 7 dias grátis <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="hero-note load-in" style={{ '--d': '190ms' }}>
            {CONFIG.offer.text}
          </p>
        </div>

        <div className="hero-visual load-in" style={{ '--d': '125ms' }}>
          <figure className="hero-card" aria-label="Exemplo de resultado da calculadora de compra">
            <div className="hc-top">
              <span className="hc-plate">ABC·1D23</span>
              <span className="hc-car">VW Polo Highline 2022</span>
            </div>
            <p className="hc-label">Pague no máximo</p>
            <p className="hc-value">R$ 79.323</p>
            <div className="hc-foot">
              <span>
                Valor de mercado <b>R$ 98.950</b>
              </span>
              <span>
                Seu lucro <b className="hc-ok">R$ 11.874</b>
              </span>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
