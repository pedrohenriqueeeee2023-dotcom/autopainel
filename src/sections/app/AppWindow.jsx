import { createContext, useContext, useEffect, useRef, useState } from 'react';
import './app.css';

/**
 * Moldura que imita o painel do AutoPainel (barra lateral azul-marinho e área
 * clara). As ferramentas da página rodam dentro dela com dados de demonstração.
 */
const NAV = [
  ['dash', 'Dashboard'],
  ['stock', 'Estoque'],
  ['pub', 'Publicação'],
  ['crm', 'CRM e vendas'],
  ['fin', 'Financeiro'],
  ['eval', 'Avaliação de compra'],
  ['agenda', 'Agenda'],
];

const PATHS = {
  dash: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  stock: 'M4 16h16v-4l-2-5H6l-2 5zM4 12h16M7 16v2M17 16v2',
  pub: 'M4 10v4l3 .5L15 19V5L7 9.5zM18 9a4 4 0 0 1 0 6',
  crm: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19c0-3 2.7-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 14c2 .6 3 2.4 3 5',
  fin: 'M4 7h16v12H4zM4 7l2-3h12l2 3M15 13h2',
  eval: 'M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h3',
  agenda: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
};

/** Quando presente, a barra lateral vira navegação entre as ferramentas. */
export const AppNav = createContext(null);

export function Icon({ name, className = 'app-ico' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export default function AppWindow({ active, children, className = '' }) {
  const nav = useContext(AppNav);
  return (
    <div className={`app ${className}`}>
      <aside className="app-side" aria-hidden={nav ? undefined : 'true'}>
        <div className="app-brand">
          <span className="app-brand-mark">
            <Icon name="stock" />
          </span>
          <span>AutoPainel</span>
        </div>
        <ul>
          {NAV.map(([k, label]) => (
            <li key={k} className={k === active ? 'on' : undefined}>
              {nav ? (
                <button
                  type="button"
                  disabled={!nav.has(k)}
                  aria-current={k === active ? 'page' : undefined}
                  onClick={() => nav.go(k)}
                  title={nav.has(k) ? label : `${label} (fora da demonstração)`}
                >
                  <Icon name={k} />
                  <span>{label}</span>
                </button>
              ) : (
                <>
                  <Icon name={k} />
                  <span>{label}</span>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="app-demo">Demonstração com dados fictícios</p>
      </aside>
      <div className="app-main">
        <div className="app-top" aria-hidden="true">
          <span className="app-burger" />
          <span className="app-store">Loja Centro · Outubro 2026</span>
          <span className="app-bell">
            <Icon name="bell" />
          </span>
          <span className="app-avatar">PM</span>
        </div>
        <div className="app-body">{children}</div>
      </div>
    </div>
  );
}

/** Dispara uma vez quando o elemento aparece na tela, depois que a janela já entrou. */
export function useStart(ref, delay = 900) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on) return undefined;
    let t = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          t = setTimeout(() => setOn(true), delay);
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [ref, delay, on]);
  return on;
}

/** Número que conta até o valor (instantâneo com movimento reduzido). */
export function useCount(target, run = true, ms = 900) {
  const [v, setV] = useState(run ? 0 : target);
  const from = useRef(0);
  useEffect(() => {
    if (!run) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setV(target);
      return undefined;
    }
    const a = from.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const val = a + (target - a) * (1 - (1 - k) ** 3);
      from.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
export const money = (v) => brl0.format(Math.round(v));
export const money2 = (v) => brl2.format(v);
export const int = (v) => Math.round(v).toLocaleString('pt-BR');
