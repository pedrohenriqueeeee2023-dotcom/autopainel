import { FAQ_ITEMS as ITEMS, ctaHref } from '../config';
import './Faq.css';

export default function Faq() {
  return (
    <section id="duvidas" className="faq" aria-labelledby="faq-title">
      <div className="faq-main">
        <div className="faq-head" data-reveal>
          <h2 id="faq-title" className="h2">
            <span className="mask">
              <span>
                Perguntas <em className="kw">frequentes</em>
              </span>
            </span>
          </h2>
        </div>
        <div className="faq-list" data-reveal data-build style={{ '--rd': '150ms' }}>
          {ITEMS.map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>
                {q}
                <span className="faq-icon" aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
      <aside
        className="faq-wa"
        data-tilt=""
        data-reveal
        style={{ '--rd': '250ms' }}
        aria-labelledby="wa-title"
      >
        <span className="faq-wa-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
            <path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.3-1.6-2.8-2.8l.9-1-1-2z" />
          </svg>
        </span>
        <h3 id="wa-title">Ficou alguma dúvida?</h3>
        <p>
          Chame a equipe no WhatsApp. A gente tira a dúvida e começa o seu teste de 7 dias com o Raio-X
          grátis.
        </p>
        <a className="btn btn-wa btn-lg" href={ctaHref('contact')} target="_blank" rel="noreferrer">
          Chamar no WhatsApp
        </a>
      </aside>
    </section>
  );
}
