const ITEMS = [
  {
    at: '0.1',
    title: 'Estoque',
    text: 'Cada veículo com custo, status e tempo de pátio.',
    ui: (
      <ul className="op-rows">
        {[
          ['Renegade Longitude 2021', 'Anunciado', '12 dias'],
          ['Onix LT 1.0 2020', 'Em preparação', '4 dias'],
          ['HB20 Comfort 2019', 'Reservado', '27 dias'],
          ['Corolla XEi 2018', 'Anunciado', '41 dias'],
        ].map(([a, b, c]) => (
          <li key={a}>
            <span>{a}</span>
            <span className="pill">{b}</span>
            <span className="mono">{c}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    at: '0.24',
    title: 'Financeiro',
    text: 'Entradas, saídas e relatórios prontos para o contador.',
    ui: (
      <div className="op-chart">
        {[42, 58, 50, 71, 64, 82].map((h, i) => (
          <span key={i} style={{ '--h': `${h}%` }} />
        ))}
        <p className="op-file">Relatório mensal · set/2026.pdf</p>
      </div>
    ),
  },
  {
    at: '0.38',
    title: 'Vendas e comissões',
    text: 'Quem vendeu, quanto vendeu e quanto recebe.',
    ui: (
      <ul className="op-rows">
        {[
          ['Carlos', '6 vendas', 'R$ 4.820'],
          ['Juliana', '5 vendas', 'R$ 3.950'],
          ['Rafael', '3 vendas', 'R$ 2.310'],
        ].map(([a, b, c]) => (
          <li key={a}>
            <span>{a}</span>
            <span className="mono">{b}</span>
            <span className="mono accent">{c}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    at: '0.52',
    title: 'Pagamento pós-venda',
    text: 'Venda confirmada gera as instruções de pagamento automaticamente.',
    ui: (
      <div className="op-pay">
        <span className="pill ok">Venda confirmada</span>
        <p>Instruções geradas para o financeiro:</p>
        <ol>
          <li>Quitar financiamento do veículo — R$ 21.300</li>
          <li>Comissão do vendedor — R$ 820</li>
          <li>Repasse ao consignante — R$ 48.000</li>
        </ol>
      </div>
    ),
  },
  {
    at: '0.66',
    title: 'Painéis por perfil',
    text: 'Sócio, gerente, vendedor e financeiro veem o que importa para cada um.',
    ui: (
      <div className="op-roles">
        {['Sócio', 'Gerente', 'Vendedor', 'Financeiro'].map((r, i) => (
          <span key={r} className={i === 1 ? 'on' : ''}>
            {r}
          </span>
        ))}
        <div className="op-kpis">
          <p>
            <b>18</b> vendas no mês
          </p>
          <p>
            <b>31 dias</b> giro médio
          </p>
          <p>
            <b>14,2%</b> margem média
          </p>
        </div>
      </div>
    ),
  },
  {
    at: '0.8',
    title: 'Avisos e tarefas',
    text: 'Pendências e indicadores antes de virarem problema.',
    ui: (
      <ul className="op-tasks">
        <li>Documentação do Onix vence em 3 dias</li>
        <li>Corolla XEi há 41 dias no pátio</li>
        <li>2 clientes sem retorno desde sexta</li>
      </ul>
    ),
  },
];

export default function Operation() {
  return (
    <section id="operacao" className="scene scene-ops" data-scene aria-labelledby="ops-title">
      <div className="stage" data-o="0.97 1">
        <div className="copy">
          <p className="eyebrow">E o resto da operação</p>
          <h2 id="ops-title" className="h2">
            <span className="mask" data-r="0 0.08">
              <span>Sua operação inteira.</span>
            </span>
            <span className="mask" data-r="0.03 0.11">
              <span>Em um só lugar.</span>
            </span>
          </h2>
          <ol className="op-list">
            {ITEMS.map((it) => (
              <li key={it.title} data-at={it.at}>
                <strong>{it.title}</strong>
                <span>{it.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="op-screen ui-card" aria-hidden="true">
          {ITEMS.map((it, i) => (
            <div key={it.title} className="op-panel" data-i={i + 1}>
              <div className="ui-bar">
                <span className="dot" />
                <span>{it.title}</span>
              </div>
              {it.ui}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
