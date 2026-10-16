const BENEFITS = [
  ['01', 'Publicação automática', 'de veículos.'],
  ['02', 'CRM inteligente', 'para recuperar vendas.'],
  ['03', 'Calculadora inteligente', 'para comprar melhor.'],
];

export default function Opening() {
  return (
    <section id="topo" className="scene scene-open" data-scene aria-labelledby="open-title">
      <div className="stage">
        <div className="open-hero" data-o="0.08 0.36">
          <p className="eyebrow load-in" style={{ '--d': '0ms' }}>
            Para donos e gestores de revendas de seminovos
          </p>
          <h1 id="open-title" className="open-title">
            <span className="mask load-mask" style={{ '--d': '80ms' }}>
              <span>Sua loja vende carros.</span>
            </span>
            <span className="mask load-mask dim" style={{ '--d': '220ms' }}>
              <span>Não deveria perder tempo operando sistemas.</span>
            </span>
          </h1>
          <p className="open-sub load-in" style={{ '--d': '520ms' }}>
            Anuncie uma vez. Recupere oportunidades. Compre melhor.
          </p>
          <div className="load-in" style={{ '--d': '640ms' }}>
            <a className="btn btn-accent btn-lg" href="#publicacao">
              Conhecer o sistema <span aria-hidden="true">↓</span>
            </a>
          </div>
          <span className="scroll-cue load-in" style={{ '--d': '900ms' }} aria-hidden="true" />
        </div>

        <div className="open-pillars" data-r="0.3 0.42" data-o="0.9 1">
          <p className="eyebrow">Três motores. Uma operação.</p>
          <ol className="pillars">
            {BENEFITS.map(([n, strong, rest], i) => (
              <li key={n} className="pillar" data-r={`${0.36 + i * 0.14} ${0.5 + i * 0.14}`}>
                <span className="pillar-n">{n}</span>
                <span className="mask">
                  <span>
                    <strong>{strong}</strong> {rest}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
