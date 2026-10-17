import { CONFIG, ctaHref } from '../config';
import './Faq.css';

const [anual, mensal] = CONFIG.plans;

const ITEMS = [
  [
    'Quanto custa?',
    `R$ ${anual.price}/mês no plano anual, pago de uma vez (R$ 1.044 por 12 meses), ou R$ ${mensal.price}/mês no plano mensal.`,
  ],
  [
    'Tem fidelidade?',
    'O plano mensal não tem fidelidade. O anual cobre 12 meses de uso com um pagamento único.',
  ],
  [
    'Como funciona o teste grátis?',
    'Os 3 primeiros clientes usam o AutoPainel por 30 dias sem pagar. Você vê as condições de cobrança antes de confirmar qualquer plano.',
  ],
  [
    'Em quais canais o anúncio é publicado?',
    'OLX, Mercado Livre, o site da loja, Tray, Nuvemshop, Shopify, WooCommerce e Loja Integrada. Você configura a integração de cada canal uma vez.',
  ],
  [
    'A avaliação de compra usa a tabela FIPE?',
    'Sim. Você digita a placa e o painel mostra a FIPE e anúncios parecidos como referência. Margem e custos você define.',
  ],
  [
    'Quem da loja pode usar?',
    'Sócio, gerente, vendedor e financeiro. Cada perfil tem um painel com o que importa para a função.',
  ],
];

export default function Faq() {
  return (
    <section id="duvidas" className="faq" aria-labelledby="faq-title">
      <div className="faq-main">
        <div className="faq-head" data-reveal>
          <h2 id="faq-title" className="h2">
            <span className="mask">
              <span>Perguntas frequentes</span>
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
        <p>Fale com a equipe do AutoPainel pelo WhatsApp e veja o painel com os dados da sua loja.</p>
        <a className="btn btn-wa btn-lg" href={ctaHref('contact')}>
          Chamar no WhatsApp
        </a>
        <a className="btn btn-accent btn-lg" href={ctaHref('trial')}>
          {CONFIG.ctas.trial.label}
        </a>
      </aside>
    </section>
  );
}
