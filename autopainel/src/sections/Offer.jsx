import { CONFIG, ctaHref } from '../config';
import './Offer.css';

/* Sem planos por enquanto: a seção explica o teste de 7 dias em quatro passos. */
const STEPS = [
  ['Crie sua conta', 'Leva um minuto, sem cartão.'],
  ['Raio-X grátis', 'A equipe faz o Raio-X da sua loja, sem custo.'],
  ['Onboarding pela equipe', 'A gente cadastra a loja, os carros e os vendedores.'],
  ['7 dias de teste', 'Use a calculadora de compra e o painel no dia a dia.'],
];

export default function Offer() {
  return (
    <section id="planos" className="offer" aria-labelledby="offer-title">
      <div className="offer-head" data-reveal>
        <p className="offer-badge">
          <span>{CONFIG.offer.badge}</span> {CONFIG.offer.text}
        </p>
        <h2 id="offer-title" className="h2">
          <span className="mask">
            <span>
              Teste <em className="kw">7 dias.</em>
            </span>
          </span>
          <span className="mask dim" style={{ '--i': 1 }}>
            <span>A gente configura.</span>
          </span>
        </h2>
        <a className="btn btn-accent btn-lg" href={ctaHref('trial')} target="_blank" rel="noreferrer">
          {CONFIG.ctas.trial.label} <span aria-hidden="true">→</span>
        </a>
      </div>

      <ol className="offer-steps" data-reveal data-build style={{ '--rd': '120ms' }}>
        {STEPS.map(([title, text], i) => (
          <li key={title} style={{ '--i': i }}>
            <span className="offer-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
