import './BeforeAfter.css';
/* Problema → solução em três cartões. */
const ITEMS = [
  ['Cadastrar o mesmo carro em cada site', 'Você cadastra uma vez e publica em 8 canais.'],
  ['O cliente pediu um carro e ninguém lembrou', 'O vendedor recebe o aviso quando o carro chega.'],
  ['Comprar a troca no chute', 'O painel mostra até quanto pagar pela placa.'],
];

export default function BeforeAfter() {
  return (
    <section id="como" className="ba" aria-labelledby="ba-title">
      <div className="ba-head" data-reveal>
        <h2 id="ba-title" className="h2">
          <span className="mask">
            <span>
              O que <em className="kw">trava</em> a sua revenda hoje
            </span>
          </span>
        </h2>
      </div>
      <div className="ba-grid" data-reveal data-build style={{ '--rd': '150ms' }}>
        {ITEMS.map(([before, after], i) => (
          <article key={before} className="ba-card" data-tilt="" style={{ '--i': i }}>
            <p className="ba-tag ba-tag-bad">Antes</p>
            <h3>{before}</h3>
            <p className="ba-tag ba-tag-ok">Com o AutoPainel</p>
            <p className="ba-after">{after}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
