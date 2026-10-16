import { CONFIG, ctaHref } from '../config';

export default function Offer() {
  return (
    <section id="planos" className="offer" aria-labelledby="offer-title">
      <div className="offer-head" data-reveal>
        <h2 id="offer-title" className="h2">
          Menos trabalho operacional. <span className="dim">Mais controle sobre cada venda.</span>
        </h2>
        <p className="offer-badge">
          <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
        </p>
      </div>

      <div className="plans" data-reveal>
        {CONFIG.plans.map((p) => (
          <article
            key={p.id}
            className={`plan ${p.highlight ? 'plan-hl' : ''}`}
            aria-labelledby={`plan-${p.id}`}
          >
            <h3 id={`plan-${p.id}`}>
              {p.name}
              {p.highlight && <span className="pill accent">Melhor custo</span>}
            </h3>
            <p className="plan-price">
              <small>R$</small>
              {p.price}
              <span>{p.period}</span>
            </p>
            <p className="plan-billing">{p.billing}</p>
          </article>
        ))}
      </div>

      <div className="offer-ctas" data-reveal>
        <a className="btn btn-accent btn-lg" href={ctaHref('trial')}>
          {CONFIG.ctas.trial.label}
        </a>
        <a className="btn btn-ghost btn-lg" href={ctaHref('contact')}>
          {CONFIG.ctas.contact.label}
        </a>
      </div>
      <p className="offer-fine">
        O teste gratuito vale para os 3 primeiros clientes. Condições de cobrança são apresentadas antes da
        confirmação.
      </p>
    </section>
  );
}
