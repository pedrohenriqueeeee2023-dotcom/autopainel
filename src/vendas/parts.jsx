import { Children, Fragment, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { CONFIG, ctaHref } from '../config';

/* Peças usadas pelas seções da página de vendas. */

/** Números pseudoaleatórios com semente: o mesmo desenho a cada carga. */
export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Marca o trecho de um <Split> que vai em degradê. */
export function G({ children }) {
  return children;
}

/**
 * Título que entra letra por letra (o trecho em <G> entra palavra por
 * palavra, para o degradê não quebrar). O leitor de tela lê o texto inteiro.
 * `start` continua a contagem de outra linha; `step` é o atraso entre letras.
 */
export function Split({ children, start = 0, step }) {
  const parts = [];
  Children.forEach(children, (c) => {
    if (typeof c === 'string') parts.push([c, false]);
    else if (isValidElement(c) && c.type === G) parts.push([String(c.props.children), true]);
  });
  const plain = parts.map(([t]) => t).join('');
  const st = step ?? Math.max(10, Math.min(26, 900 / plain.replace(/\s/g, '').length));
  let i = start;
  const out = [];
  parts.forEach(([text, grad], pi) =>
    text.split(/(\s+)/).forEach((w, wi) => {
      if (!w) return;
      if (/^\s+$/.test(w)) return out.push(' ');
      const key = `${pi}-${wi}`;
      if (grad) {
        out.push(
          <span key={key} className="w ch v-grad" style={{ '--i': i }}>
            {w}
          </span>,
        );
        i += w.length;
        return;
      }
      out.push(
        <span key={key} className="w">
          {[...w].map((c, ci) => (
            <span key={ci} className="ch" style={{ '--i': i++ }}>
              {c}
            </span>
          ))}
        </span>,
      );
    }),
  );
  return (
    <>
      <span className="v-sr">{plain} </span>
      <span className="v-split" aria-hidden="true" style={{ '--st': `${st}ms` }}>
        {out}
      </span>
    </>
  );
}

/** Parágrafo que aparece palavra por palavra. */
export function Words({ children, step = 14 }) {
  const words = String(children).split(/\s+/);
  return words.map((w, i) => (
    <Fragment key={i}>
      <span className="wd" style={{ '--i': i, '--st': `${step}ms` }}>
        {w}
      </span>
      {i < words.length - 1 ? ' ' : ''}
    </Fragment>
  ));
}

/** Conta de 0 até `to` quando entra na tela. */
export function Counter({ to, suffix = '' }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1800);
        setN(Math.round(to * (1 - Math.pow(1 - k, 4))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {n.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

/** Botão de conversão: teste (branco, com seta) ou contato (contorno). */
export function Cta({ kind = 'trial', className = '', children }) {
  return (
    <a
      className={`v-btn ${kind === 'trial' ? 'v-btn-main' : 'v-btn-line'} ${className}`}
      href={ctaHref(kind)}
      target="_blank"
      rel="noreferrer"
      data-magnet=""
    >
      {children || CONFIG.ctas[kind].label}
      {kind === 'trial' && (
        <span className="v-btn-dot" aria-hidden="true">
          →
        </span>
      )}
    </a>
  );
}

/** Pontos de luz que piscam. */
export function Sparks({ n = 18, seed = 1, className = '' }) {
  const r = seeded(seed);
  return (
    <div className={`v-sparks ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(r() * 100).toFixed(1)}%`,
            top: `${(r() * 100).toFixed(1)}%`,
            '--s': `${(1 + r() * 2.2).toFixed(1)}px`,
            '--t': `${(2.5 + r() * 4).toFixed(1)}s`,
            '--dl': `${(-r() * 6).toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Estrelas cadentes. */
export function Meteors({ n = 4, seed = 2 }) {
  const r = seeded(seed);
  return (
    <div className="v-meteors" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{
            '--x': `${(30 + r() * 70).toFixed(0)}%`,
            '--y': `${(r() * 40).toFixed(0)}%`,
            '--t': `${(6 + r() * 6).toFixed(1)}s`,
            '--dl': `${(-r() * 10).toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  );
}

const CELL = 64;

/**
 * Grade fina de fundo com cruzinhas nas interseções e linhas de luz em "L"
 * que correm pelas linhas da grade. Mede a seção para alinhar tudo.
 */
export function GridFx({ seed = 1, runners = 3 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const paths = [];
  const plus = [];
  if (size) {
    const cols = Math.floor(size.w / CELL);
    const rows = Math.floor(size.h / CELL);
    const r = seeded(seed);
    for (let k = 0; k < runners && cols > 5 && rows > 3; k++) {
      const x0 = Math.floor(r() * (cols - 5)) * CELL;
      const y0 = Math.floor(r() * (rows - 2)) * CELL;
      const x1 = x0 + (2 + Math.floor(r() * 4)) * CELL;
      const y1 = Math.min(y0 + (1 + Math.floor(r() * 3)) * CELL, rows * CELL);
      paths.push({
        d: `M${x0} ${y0}H${x1}V${y1}`,
        len: x1 - x0 + (y1 - y0),
        t: (5 + r() * 4).toFixed(1),
        dl: (-r() * 8).toFixed(1),
      });
    }
    for (let x = 1; x < cols; x++)
      for (let y = 1; y < rows; y++)
        if ((x + y * 2) % 5 === 0) plus.push(`M${x * CELL - 4} ${y * CELL}h8M${x * CELL} ${y * CELL - 4}v8`);
  }

  return (
    <div className="v-gridfx" ref={ref} aria-hidden="true">
      {size && (
        <svg width={size.w} height={size.h}>
          <defs>
            <pattern id={`g${id}`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
              <path d={`M${CELL} 0H0V${CELL}`} />
            </pattern>
            <filter id={`f${id}`} filterUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h}>
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill={`url(#g${id})`} />
          <path className="v-plus" d={plus.join('')} />
          {paths.map((p) => (
            <path
              key={p.d}
              className="v-run"
              d={p.d}
              filter={`url(#f${id})`}
              style={{ '--len': p.len, '--t': `${p.t}s`, '--dl': `${p.dl}s` }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}

/** Cor de cada letra da faixa: vai e volta entre o azul claro e o da marca. */
function shade(t) {
  const k = 1 - Math.abs(2 * t - 1);
  const a = [127, 214, 255];
  const b = [0, 163, 236];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

/**
 * Texto gigante em faixa (o movimento fica em fx.js). Com `curve`, cada letra
 * vira um elemento para poder entrar subindo pela curva.
 */
export function Marquee({ text, curve = false, speed = 1, className = '' }) {
  const copy = (k) =>
    curve
      ? [...text].map((c, i) => (
          <span key={`${k}${i}`} className="ch" style={{ color: shade(i / text.length) }}>
            {c}
          </span>
        ))
      : text;
  return (
    <div
      className={`v-mq ${className}`}
      data-mq={speed}
      data-curve={curve ? '' : undefined}
      aria-hidden="true"
    >
      <div className="v-mq-track">
        <span>{copy('a')}</span>
        <span>{copy('b')}</span>
      </div>
    </div>
  );
}

/** Cantos em "L" que se desenham numa moldura. */
export function Corners() {
  return ['tl', 'tr', 'bl', 'br'].map((c) => <span key={c} className={`v-corner ${c}`} aria-hidden="true" />);
}
