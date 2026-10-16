import CarGlyph from './CarGlyph';

const FIELDS = [
  ['Marca / modelo', 'Jeep Renegade Longitude 1.8'],
  ['Ano', '2020 / 2021'],
  ['Quilometragem', '48.300 km'],
  ['Preço', 'R$ 92.900'],
];

const CHANNELS = [
  { name: 'OLX', meta: 'Anúncio de classificados', id: 'olx' },
  { name: 'Mercado Livre', meta: 'Veículos', id: 'ml' },
  { name: 'Site da loja', meta: 'suarevenda.com.br/estoque', id: 'site' },
];

export default function Publishing() {
  return (
    <section id="publicacao" className="scene scene-pub" data-scene aria-labelledby="pub-title">
      <div className="stage" data-r="0 0.08" data-o="0.96 1">
        <div className="copy">
          <p className="eyebrow accent">01 · Publicação</p>
          <h2 id="pub-title" className="h2">
            <span className="mask" data-r="0.02 0.1">
              <span>Um cadastro.</span>
            </span>
            <span className="mask" data-r="0.06 0.14">
              <span>Vários canais.</span>
            </span>
          </h2>
          <p className="lead fx-up" data-r="0.1 0.18">
            Cadastre o veículo uma vez. O AutoPainel distribui o anúncio para os canais de venda da loja e
            mantém tudo sincronizado em um só lugar.
          </p>
          <ol className="steps">
            <li data-at="0.12">Cadastro com dados e fotos</li>
            <li data-at="0.44">Publicação com um clique</li>
            <li data-at="0.66">Status por canal, centralizado</li>
          </ol>
          <p className="disclaimer">
            Demonstração ilustrativa. Canais disponíveis dependem das integrações ativas.
          </p>
        </div>

        <div className="pub-demo" aria-hidden="true">
          <svg className="pub-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[18, 50, 82].map((y, i) => (
              <path
                key={y}
                data-r={`${0.5 + i * 0.04} ${0.64 + i * 0.04}`}
                d={`M40 50 C 55 50, 55 ${y}, 66 ${y}`}
                pathLength="1"
              />
            ))}
          </svg>

          <div className="ui-card pub-form" data-r="0.04 0.16" data-o="0.46 0.62">
            <div className="ui-bar">
              <span className="dot" />
              <span>Novo veículo</span>
              <span className="ui-tag">Estoque · #0412</span>
            </div>
            <div className="pub-photos">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="pub-photo" data-at={0.15 + i * 0.03}>
                  <CarGlyph tone={i} />
                </div>
              ))}
            </div>
            <dl className="pub-fields">
              {FIELDS.map(([k, v], i) => (
                <div key={k} className="field" data-at={0.25 + i * 0.04}>
                  <dt>{k}</dt>
                  <dd>
                    <span className="typed">{v}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="pub-actions">
              <span className="ui-chip">3 canais selecionados</span>
              <span className="ui-btn" data-at="0.42">
                Publicar
              </span>
            </div>
          </div>

          <div className="pub-hub" data-r="0.46 0.58">
            <CarGlyph tone={0} />
            <div>
              <strong>Renegade Longitude</strong>
              <span>1 anúncio · 3 canais</span>
            </div>
          </div>

          <ul className="pub-channels">
            {CHANNELS.map((c, i) => (
              <li
                key={c.id}
                className={`ui-card channel ch-${c.id}`}
                data-r={`${0.52 + i * 0.05} ${0.66 + i * 0.05}`}
              >
                <span className="ch-logo">{c.name}</span>
                <span className="ch-meta">{c.meta}</span>
                <span className="ch-status" data-at={0.7 + i * 0.05}>
                  <span className="pending">Enviando…</span>
                  <span className="done">Publicado</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
