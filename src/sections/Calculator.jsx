import { useEffect, useId, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { formatBRL, formatNum, parseBRL } from '../format';

/**
 * Preço máximo de compra = revenda × (1 − margem) − custos.
 * A margem é bruta, sobre o preço de REVENDA (não markup sobre o custo).
 */
export function maxPurchase(resale, marginPct, costs) {
  return resale * (1 - marginPct / 100) - costs;
}

/** Número que desliza até o novo valor (instantâneo com movimento reduzido). */
function useTween(value) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 380);
      const v = a + (value - a) * (1 - Math.pow(1 - k, 3));
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

function Control({ label, hint, value, onChange, min, max, step, kind }) {
  const id = useId();
  const [draft, setDraft] = useState(null);
  const text = kind === 'pct' ? String(value) : formatBRL(value);
  const commit = (raw) => {
    const n =
      kind === 'pct'
        ? Number(
            String(raw)
              .replace(',', '.')
              .replace(/[^\d.]/g, ''),
          )
        : parseBRL(raw);
    if (!Number.isNaN(n)) onChange(Math.min(kind === 'pct' ? 95 : 5000000, Math.max(0, n)));
    setDraft(null);
  };
  const fill = ((Math.min(max, value) - min) / (max - min)) * 100;
  return (
    <div className="calc-ctrl">
      <div className="calc-ctrl-head">
        <label htmlFor={id}>{label}</label>
        <div className="calc-input">
          <input
            id={id}
            inputMode={kind === 'pct' ? 'decimal' : 'numeric'}
            value={draft ?? text}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
            aria-describedby={`${id}-h`}
          />
          {kind === 'pct' && <span aria-hidden="true">%</span>}
        </div>
      </div>
      <input
        type="range"
        className="calc-range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, value)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={kind === 'pct' ? `${value}%` : formatBRL(value)}
        style={{ '--fill': `${fill}%` }}
      />
      <p id={`${id}-h`} className="calc-hint">
        {hint}
      </p>
    </div>
  );
}

export default function Calculator() {
  const init = CONFIG.calculator;
  const [resale, setResale] = useState(init.resale);
  const [margin, setMargin] = useState(init.margin);
  const [costs, setCosts] = useState(init.costs);
  const [asking, setAsking] = useState(init.asking);

  const max = maxPurchase(resale, margin, costs);
  const marginValue = resale * (margin / 100);
  const viable = max > 0;
  const totalCost = max + costs;
  const markup = viable ? (marginValue / totalCost) * 100 : 0;
  const shown = useTween(max);
  const diff = asking - max;

  const seg = (v) => `${Math.max(0, (v / resale) * 100)}%`;

  return (
    <section id="calculadora" className="calc" aria-labelledby="calc-title">
      <div className="calc-head" data-reveal>
        <p className="eyebrow accent">03 · Calculadora de compra</p>
        <h2 id="calc-title" className="h2">
          Antes de comprar, <br />
          saiba até quanto pagar.
        </h2>
        <p className="lead">
          Informe o preço de revenda, a margem que a loja quer e os custos previstos. O teto de compra é
          recalculado na hora — e a negociação começa com um número, não com um palpite.
        </p>
      </div>

      <div className="calc-tool ui-card" data-reveal>
        <div className="ui-bar">
          <span className="dot" />
          <span>Avaliação de compra</span>
          <span className="ui-tag">VW Gol 1.0 2016 · exemplo</span>
        </div>

        <div className="calc-grid">
          <form className="calc-inputs" onSubmit={(e) => e.preventDefault()} aria-label="Dados da avaliação">
            <Control
              label="Preço estimado de revenda"
              hint="Quanto a loja espera vender o carro."
              value={resale}
              onChange={setResale}
              min={5000}
              max={250000}
              step={500}
            />
            <Control
              label="Margem bruta desejada"
              hint="Percentual sobre o preço de revenda."
              value={margin}
              onChange={setMargin}
              min={0}
              max={60}
              step={1}
              kind="pct"
            />
            <Control
              label="Custos estimados"
              hint="Preparação, documentação, comissão e transação."
              value={costs}
              onChange={setCosts}
              min={0}
              max={30000}
              step={100}
            />
          </form>

          <div className="calc-out" aria-live="polite">
            <p className="calc-out-label">Preço máximo de compra recomendado</p>
            <p className={`calc-out-value ${viable ? '' : 'bad'}`}>
              {viable ? formatBRL(shown) : 'Inviável'}
            </p>
            <p className="calc-formula">
              {formatBRL(resale)} × (1 − {formatNum(margin)}%) − {formatBRL(costs)}
            </p>

            <div className="calc-bar" role="img" aria-label="Composição do preço de revenda">
              <span className="b-buy" style={{ width: seg(max) }} />
              <span className="b-cost" style={{ width: seg(costs) }} />
              <span className="b-margin" style={{ width: seg(marginValue) }} />
            </div>
            <ul className="calc-legend">
              <li>
                <i className="b-buy" />
                Compra <b>{viable ? formatBRL(max) : '—'}</b>
              </li>
              <li>
                <i className="b-cost" />
                Custos <b>{formatBRL(costs)}</b>
              </li>
              <li>
                <i className="b-margin" />
                Margem <b>{formatBRL(marginValue)}</b>
              </li>
            </ul>

            <p className="calc-note">
              Margem de {formatNum(margin)}% sobre a venda ={' '}
              {viable ? (
                <>
                  markup de <b>{formatNum(markup)}%</b> sobre o custo total (compra + custos).
                </>
              ) : (
                'os custos superam o que sobra da revenda.'
              )}
            </p>

            <div className="calc-ask">
              <Control
                label="Valor pedido pelo vendedor"
                hint="Compare a proposta com o teto."
                value={asking}
                onChange={setAsking}
                min={0}
                max={Math.max(resale, 5000)}
                step={250}
              />
              <p className={`calc-verdict ${viable && diff <= 0 ? 'ok' : 'bad'}`}>
                {!viable
                  ? 'Revise os números: não há preço de compra que entregue essa margem.'
                  : diff <= 0
                    ? `Dentro do limite. Folga de ${formatBRL(-diff)}.`
                    : `Acima do limite em ${formatBRL(diff)}. Negocie ou recuse.`}
              </p>
            </div>
          </div>
        </div>

        <p className="disclaimer">
          Margem bruta é calculada sobre o preço de revenda; markup é calculado sobre o custo. Referências
          FIPE, dados do veículo e comparação de mercado dependem das integrações e fontes de dados
          disponíveis — nesta demonstração os valores são informados manualmente.
        </p>
      </div>
    </section>
  );
}
