import { CONFIG, ctaHref } from '../config';
import './Offer.css';

const [anual, mensal] = CONFIG.plans;

/* Planos como cartas de baralho: as três entram empilhadas e se abrem em leque.
   A terceira carta mostra o custo de continuar sem sistema. */
const CARDS = [
  { ...mensal, mark: 'M' },
  { ...anual, mark: 'A' },
  { id: 'sem', name: 'Continuar sem', mark: '✕' },
];

export default function Offer() {
  return (
    <section id="planos" className="offer" aria-labelledby="offer-title">
      <div className="offer-head" data-reveal>
        <h2 id="offer-title" className="h2">
          <span className="mask" style={{ '--i': 0 }}>
            <span>Comece com 30 dias grátis.</span>
          </span>
        </h2>
        <p className="offer-badge">
          <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
        </p>
      </div>

      <div className="deck" data-reveal style={{ '--rd': '150ms' }}>
        {CARDS.map((c, i) => (
          <article
            key={c.id}
            className={`pcard pcard-${c.id} ${c.highlight ? 'is-hl' : ''}`}
            style={{ '--i': i - 1 }}
            aria-labelledby={`plan-${c.id}`}
          >
            <span className="pcard-pip" aria-hidden="true">
              {c.mark}
            </span>
            <span className="pcard-pip pcard-pip-b" aria-hidden="true">
              {c.mark}
            </span>
            <h3 id={`plan-${c.id}`}>
              {c.name}
              {c.highlight && <span className="pcard-tag">Melhor custo</span>}
            </h3>

            {c.id === 'sem' ? (
              <>
                <p className="plan-price">
                  <small>R$</small>0<span>/mês</span>
                </p>
                <p className="pcard-sem-line">Você paga gastando tempo e perdendo venda.</p>
                <ul className="pcard-list">
                  <li>Cadastrar o mesmo carro em cada site</li>
                  <li>Saber tarde que chegou o carro que o cliente pediu</li>
                  <li>Comprar sem saber até quanto pagar</li>
                </ul>
                <a className="btn btn-ghost" href={ctaHref('trial')}>
                  Prefiro testar grátis
                </a>
              </>
            ) : (
              <>
                <p className="plan-price">
                  <small>R$</small>
                  {c.price}
                  <span>{c.period}</span>
                </p>
                <p className="plan-billing">{c.billing}</p>
                <a className={`btn ${c.highlight ? 'btn-light' : 'btn-accent'}`} href={ctaHref('trial')}>
                  {CONFIG.ctas.trial.label}
                </a>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
