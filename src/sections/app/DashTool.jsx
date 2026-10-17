import { useRef, useState } from 'react';
import AppWindow, { int, money, money2, useCount, useStart } from './AppWindow';

const BARS = [
  ['Mai', 410],
  ['Jun', 465],
  ['Jul', 398],
  ['Ago', 520],
  ['Set', 588],
  ['Out', 212],
];
const GOALS = [
  ['Carlos', 2, 10],
  ['Ana', 1, 8],
  ['Bruno', 0, 8],
];
const ENTRIES = [
  ['18/10', 'Sinal Honda HR-V', 'Sinal', 'Honda HR-V 2021 · Ana', 10000, 'Pendente'],
  ['15/10', 'Aluguel do pátio', 'Aluguel', '', -8500, 'Pendente'],
  ['12/10', 'Venda Fiat Toro Volcano', 'Venda', 'Fiat Toro 2021 · Carlos', 139000, 'Pago'],
  ['11/10', 'Preparação VW T-Cross', 'Preparação', 'VW T-Cross 2022', -3200, 'Pendente'],
  ['08/10', 'Comissão Fiat Toro', 'Comissão', 'Carlos', -1450, 'Pago'],
];

function Kpi({ label, value, fmt = money, note, run, className = '', children }) {
  const v = useCount(value, run, 1100);
  return (
    <div className={`a-card kpi ${className}`}>
      <span>{label}</span>
      <strong>{fmt(v)}</strong>
      {children}
      {note && <small>{note}</small>}
    </div>
  );
}

export default function DashTool({ initialTab = 'dash' }) {
  const ref = useRef(null);
  const start = useStart(ref);
  const [tab, setTab] = useState(initialTab);
  const [type, setType] = useState('Todos');
  const rows = ENTRIES.filter(([, , , , v]) => type === 'Todos' || (type === 'Entradas' ? v > 0 : v < 0));

  return (
    <div ref={ref} className={`dash-tool ${start ? 'is-run' : ''}`}>
      <AppWindow active={tab === 'dash' ? 'dash' : 'fin'}>
        <div className="pg-head">
          <div>
            <h3 className="pg-title">{tab === 'dash' ? 'Boa tarde, Pedro' : 'Financeiro'}</h3>
            <p className="pg-sub">
              {tab === 'dash' ? 'Aqui está o resumo da sua loja hoje.' : 'Outubro 2026 · 5 lançamentos'}
            </p>
          </div>
          <div className="a-tabs" role="tablist" aria-label="Telas do painel">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'dash'}
              className={tab === 'dash' ? 'on' : ''}
              onClick={() => setTab('dash')}
            >
              Dashboard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'fin'}
              className={tab === 'fin' ? 'on' : ''}
              onClick={() => setTab('fin')}
            >
              Financeiro
            </button>
          </div>
        </div>

        {tab === 'dash' ? (
          <div className="dash" key="dash">
            <div className="kpis">
              <Kpi label="Faturamento no mês" value={211900} run={start} className="kpi-hero">
                <span className="kpi-bar">
                  <i style={{ width: start ? '35%' : 0 }} />
                </span>
                <small>Meta: R$ 600 mil (35%)</small>
              </Kpi>
              <Kpi label="Veículos disponíveis" value={4} fmt={int} note="6 no total" run={start} />
              <Kpi label="Valor em estoque" value={749200} note="Preço de venda anunciado" run={start} />
              <Kpi label="Lucro médio por veículo" value={14725} note="Últimas 6 vendas" run={start} />
            </div>
            <div className="dash-row">
              <div className="a-card chart">
                <div className="chart-head">
                  <h4>Faturamento (R$ mil)</h4>
                  <small>Últimos 6 meses</small>
                </div>
                <div className="bars">
                  {BARS.map(([m, v], i) => (
                    <div key={m} className="bar" style={{ '--h': `${(v / 600) * 100}%`, '--i': i }}>
                      <b>{v}</b>
                      <i />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="a-card goals">
                <h4>Metas por vendedor</h4>
                {GOALS.map(([n, d, t], i) => (
                  <div key={n} className="goal" style={{ '--w': `${(d / t) * 100}%`, '--i': i }}>
                    <span>{n}</span>
                    <small>
                      {d}/{t} vendas
                    </small>
                    <span className="goal-bar">
                      <i />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="fin" key="fin">
            <div className="kpis">
              <Kpi label="Saldo em caixa" value={2590560} fmt={money2} note="Lançamentos pagos" run />
              <Kpi label="A receber" value={10000} fmt={money2} note="Pendentes" run className="kpi-in" />
              <Kpi label="A pagar" value={11700} fmt={money2} note="Pendentes" run className="kpi-out" />
              <Kpi label="Comissões do mês" value={1450} fmt={money2} note="Carlos, Ana e Bruno" run />
            </div>
            <div className="st-chips fin-filter" role="group" aria-label="Filtrar lançamentos">
              {['Todos', 'Entradas', 'Saídas'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`a-chip ${type === t ? 'on' : ''}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
              <span className="a-btn fin-csv" aria-hidden="true">
                Enviar ao contador
              </span>
            </div>
            <div className="a-card fin-table">
              {rows.map(([d, desc, cat, who, v, s], i) => (
                <div key={desc} className="fin-row" style={{ '--i': i }}>
                  <span className="fin-date">{d}</span>
                  <span className="fin-desc">
                    <strong>{desc}</strong>
                    <small>{[cat, who].filter(Boolean).join(' · ')}</small>
                  </span>
                  <span className={`fin-val ${v > 0 ? 'in' : 'out'}`}>
                    {v > 0 ? '+ ' : '− '}
                    {money2(Math.abs(v))}
                  </span>
                  <span className={`a-tag ${s === 'Pago' ? 'ok' : 'warn'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AppWindow>
    </div>
  );
}
