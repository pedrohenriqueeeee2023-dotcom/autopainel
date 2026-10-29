import { ctaHref } from '../config';
import './Opening.css';

// Foto gratuita do Unsplash (licença Unsplash).
const PHOTO = 'https://images.unsplash.com/photo-1570761511122-dd6342842496?auto=format&fit=crop&q=70';

/* Abertura: título, uma linha, um botão e a foto de um carro com a etiqueta do
   preço máximo, o resultado que a calculadora entrega. */
export default function Opening() {
  return (
    <section id="topo" className="open" aria-labelledby="open-title">
      <div className="hero-split">
        <div className="hero-copy">
          <h1 id="open-title" className="open-title">
            <span className="mask load-mask" style={{ '--d': '20ms' }}>
              <span>Pare de pagar</span>
            </span>
            <span className="mask load-mask" style={{ '--d': '55ms' }}>
              <span>
                <em className="kw">caro</em> na troca.
              </span>
            </span>
          </h1>
          <p className="open-sub load-in" style={{ '--d': '105ms' }}>
            Digite a placa e veja até quanto pagar.
          </p>
          <a
            className="btn btn-accent btn-lg hero-cta load-in"
            style={{ '--d': '150ms' }}
            href={ctaHref('trial')}
            target="_blank"
            rel="noreferrer"
          >
            Testar 7 dias grátis <span aria-hidden="true">→</span>
          </a>
        </div>

        <figure className="hero-photo load-in" style={{ '--d': '90ms' }}>
          <img
            src={`${PHOTO}&w=900&h=1100`}
            srcSet={`${PHOTO}&w=600&h=733 600w, ${PHOTO}&w=900&h=1100 900w, ${PHOTO}&w=1200&h=1466 1200w`}
            sizes="(max-width: 960px) 100vw, 45vw"
            alt="Carro seminovo com a etiqueta do preço máximo de compra"
            fetchPriority="high"
          />
          <figcaption className="hero-tag">
            <span>Pague no máximo</span>
            <strong>R$ 79.323</strong>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
