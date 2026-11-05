import { useEffect, useRef, useState } from 'react';
import { ctaHref } from '../../config';
import AppWindow, { Icon, money, useCount, useStart } from './AppWindow';
import './EvalTool.css';

// Placas de demonstração com FIPE e três anúncios parecidos.
const CARS = {
  'ABC-1D23': {
    short: 'Polo',
    model: 'VW Polo Highline 1.0 TSI',
    year: 2022,
    color: 'Prata',
    fipe: 98500,
    ads: [96900, 101500, 99800],
  },
  'RTF-4E21': {
    short: 'Corolla',
    model: 'Toyota Corolla XEi 2.0',
    year: 2022,
    color: 'Prata',
    fipe: 126400,
    ads: [128900, 124500, 127900],
  },
  'SDF-1B90': {
    short: 'Compass',
    model: 'Jeep Compass Longitude',
    year: 2023,
    color: 'Preto',
    fipe: 158700,
    ads: [164000, 156900, 161500],
  },
  'PLK-7C12': {
    short: 'T-Cross',
    model: 'VW T-Cross Highline',
    year: 2022,
    color: 'Cinza',
    fipe: 129800,
    ads: [132000, 127500, 130900],
  },
  'ZXC-9F67': {
    short: 'Creta',
    model: 'Hyundai Creta Platinum',
    year: 2023,
    color: 'Branco',
    fipe: 146300,
    ads: [149900, 144800, 147500],
  },
};
// Placa no padrão antigo (ABC-1234) ou Mercosul (ABC1D23).
const validPlate = (p) => /^[A-Z]{3}-?\d[A-Z\d]\d{2}$/.test(p);
const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;

/** Valor de mercado = média entre a FIPE e a média dos anúncios parecidos. */
export function evaluate(car, c) {
  const market = (car.fipe + avg(car.ads)) / 2;
  const profit = market * (c.margin / 100);
  const costs = c.prep + c.docs + market * ((c.tax + c.comm) / 100);
  return { market, profit, costs, max: market - profit - costs };
}

function Field({ label, value, onChange, suffix, prefix }) {
  return (
    <label className="ev-field">
      <span>{label}</span>
      <span className="a-input">
        {prefix && <i>{prefix}</i>}
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
        {suffix && <i>{suffix}</i>}
      </span>
    </label>
  );
}

export default function EvalTool() {
  const ref = useRef(null);
  const start = useStart(ref);
  const [plate, setPlate] = useState('ABC-1D23');
  const [car, setCar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [c, setC] = useState({ margin: 12, prep: 2500, tax: 3, comm: 1.5, docs: 800 });
  const timer = useRef(0);

  const consult = (p) => {
    const key = p.toUpperCase().trim();
    setPlate(key);
    setSaved(false);
    setBusy(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBusy(false);
      setCar(CARS[key] ? { ...CARS[key], plate: key } : { missing: true, plate: key });
    }, 700);
  };

  useEffect(() => {
    if (start) consult('ABC-1D23');
  }, [start]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ok = car && !car.missing;
  const r = ok ? evaluate(car, c) : { market: 0, profit: 0, costs: 0, max: 0 };
  const maxShown = useCount(r.max, ok);
  const profitShown = useCount(r.profit, ok);
  const upd = (k) => (v) => {
    setSaved(false);
    setC((s) => ({ ...s, [k]: v }));
  };

  return (
    <div ref={ref}>
      <AppWindow active="eval" className="app-tall">
        <form
          className="a-card ev-plate"
          onSubmit={(e) => {
            e.preventDefault();
            consult(plate);
          }}
        >
          <label htmlFor="ev-plate">Placa do veículo</label>
          <div className="ev-plate-row">
            <input
              id="ev-plate"
              className="a-input-raw"
              value={plate}
              maxLength={8}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
            <button type="submit" className="a-btn a-btn-primary">
              <Icon name="search" className="a-btn-ico" /> Consultar
            </button>
          </div>
          <p className="ev-demo-note">
            Demonstração: escolha um dos carros abaixo. Placas reais você consulta na sua conta.
          </p>
          <div className="ev-quick">
            <span>Atalhos:</span>
            {Object.entries(CARS).map(([p, v]) => (
              <button
                key={p}
                type="button"
                className={`a-chip ${car?.plate === p ? 'on' : ''}`}
                onClick={() => consult(p)}
              >
                {p} ({v.short})
              </button>
            ))}
          </div>
        </form>

        <div className={`ev-grid ${busy ? 'is-busy' : ''}`}>
          <div className="a-card ev-car">
            <h4>Dados do veículo</h4>
            {car?.missing ? (
              <div className="ev-missing">
                <p>
                  {validPlate(car.plate) ? (
                    <>
                      A demonstração só tem as 5 placas dos atalhos. A consulta da <b>{car.plate}</b> com FIPE
                      e anúncios reais é feita na sua conta.
                    </>
                  ) : (
                    <>Placa inválida. Use o formato ABC1D23 ou ABC-1234, ou escolha um dos atalhos.</>
                  )}
                </p>
              </div>
            ) : (
              <>
                <dl className="ev-dl">
                  <dt>Modelo</dt>
                  <dd>{ok ? car.model : '—'}</dd>
                  <dt>Ano</dt>
                  <dd>{ok ? car.year : '—'}</dd>
                  <dt>Cor</dt>
                  <dd>{ok ? car.color : '—'}</dd>
                </dl>
                <h5>Referências de mercado</h5>
                <dl className="ev-dl">
                  <dt>Tabela FIPE</dt>
                  <dd>
                    <b>{ok ? money(car.fipe) : '—'}</b>
                  </dd>
                  {(ok ? car.ads : [0, 0, 0]).map((v, i) => (
                    <FragmentRow key={i} label={`Anúncio semelhante ${i + 1}`} value={ok ? money(v) : '—'} />
                  ))}
                </dl>
                <p className="ev-market">
                  <span>Valor de mercado</span>
                  <b>{ok ? money(r.market) : '—'}</b>
                </p>
              </>
            )}
          </div>

          <div className="a-card ev-costs">
            <h4>Custos e margem</h4>
            <Field label="Margem desejada" value={c.margin} onChange={upd('margin')} suffix="%" />
            <Field label="Preparação" value={c.prep} onChange={upd('prep')} prefix="R$" />
            <Field label="Documentação" value={c.docs} onChange={upd('docs')} prefix="R$" />
            <Field label="Impostos" value={c.tax} onChange={upd('tax')} suffix="%" />
            <Field label="Comissão" value={c.comm} onChange={upd('comm')} suffix="%" />
          </div>

          {car?.missing && validPlate(car.plate) ? (
            <div className="ev-result ev-result-cta">
              <span>Quer o valor da {car.plate}?</span>
              <strong>Consulte grátis</strong>
              <p>Crie sua conta e teste 7 dias com placas reais.</p>
              <a className="ev-save ev-cta" href={ctaHref('trial')} target="_blank" rel="noreferrer">
                Criar conta e consultar →
              </a>
            </div>
          ) : (
            <div className="ev-result">
              <span>Preço máximo recomendado de compra</span>
              <strong>{ok ? money(maxShown) : '—'}</strong>
              <p>
                Lucro estimado na revenda: <b>{ok ? money(profitShown) : '—'}</b>
              </p>
              <p className="ev-small">Total de custos previstos: {ok ? money(r.costs) : '—'}</p>
              <button type="button" className="ev-save" disabled={!ok} onClick={() => setSaved(true)}>
                {saved ? '✓ Avaliação salva' : 'Salvar avaliação'}
              </button>
            </div>
          )}
        </div>
      </AppWindow>
    </div>
  );
}

function FragmentRow({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
