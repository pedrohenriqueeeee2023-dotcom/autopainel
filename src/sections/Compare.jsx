import './Compare.css';
/* Planilha + WhatsApp × AutoPainel. */
const ROWS = [
  ['Anúncios', 'Um site por vez', '8 canais com um clique'],
  ['Pedidos de clientes', 'Perdidos na conversa', 'Aviso quando o carro chega'],
  ['Avaliação de compra', 'No olho', 'FIPE, mercado e seus custos'],
  ['Estoque', 'Planilha desatualizada', 'Dias de pátio de cada carro'],
  ['Financeiro', 'Fechado no fim do mês', 'Caixa e comissões no dia'],
];

export default function Compare() {
  return (
    <section id="comparativo" className="cmp" aria-labelledby="cmp-title">
      <div className="cmp-head" data-reveal>
        <h2 id="cmp-title" className="h2">
          <span className="mask">
            <span>Planilha e WhatsApp</span>
          </span>
          <span className="mask dim" style={{ '--i': 1 }}>
            <span>
              ou <em className="kw">AutoPainel?</em>
            </span>
          </span>
        </h2>
      </div>
      <div
        className="cmp-table"
        role="table"
        aria-label="Comparativo"
        data-reveal
        data-build
        style={{ '--rd': '150ms' }}
      >
        <div className="cmp-row cmp-th" role="row">
          <span role="columnheader" />
          <span role="columnheader">Planilha + WhatsApp</span>
          <span role="columnheader" className="cmp-us">
            AutoPainel
          </span>
        </div>
        {ROWS.map(([what, old, us], i) => (
          <div key={what} className="cmp-row" role="row" style={{ '--i': i }}>
            <span role="rowheader" className="cmp-what">
              {what}
            </span>
            <span role="cell" className="cmp-old">
              <span aria-hidden="true">✕</span> {old}
            </span>
            <span role="cell" className="cmp-us">
              <span aria-hidden="true">✓</span> {us}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
