import { useEffect, useRef, useState } from 'react';
import AppWindow, { useStart } from './AppWindow';
import './PubTool.css';

// Canais da tela de Publicação e quantos carros do estoque cada um recebe.
const CHANNELS = [
  ['OLX', 4],
  ['Mercado Livre', 3],
  ['Site', 4],
  ['Tray', 4],
  ['Nuvemshop', 4],
  ['Shopify', 4],
  ['WooCommerce', 4],
  ['Loja Integrada', 4],
];

export default function PubTool() {
  const ref = useRef(null);
  const start = useStart(ref);
  // estado de cada canal: 'off' | 'busy' | 'on'
  const [st, setSt] = useState(() => CHANNELS.map(() => 'off'));
  const timers = useRef([]);
  const touched = useRef(false);

  const set = (i, v) => setSt((s) => s.map((x, j) => (j === i ? v : x)));
  const publish = (i, delay = 0) => {
    timers.current.push(setTimeout(() => set(i, 'busy'), delay));
    timers.current.push(setTimeout(() => set(i, 'on'), delay + 650));
  };
  const syncAll = () => CHANNELS.forEach((_, i) => publish(i, i * 180));

  useEffect(() => {
    if (start && !touched.current) syncAll();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const live = st.filter((s) => s === 'on').length;

  return (
    <div ref={ref}>
      <AppWindow active="pub">
        <div className="pg-head">
          <div>
            <h3 className="pg-title">Publicação</h3>
            <p className="pg-sub">
              {live} de {CHANNELS.length} canais com o estoque no ar
            </p>
          </div>
          <button
            type="button"
            className="a-btn a-btn-primary"
            onClick={() => {
              touched.current = true;
              setSt(CHANNELS.map(() => 'off'));
              timers.current.push(setTimeout(syncAll, 120));
            }}
          >
            Sincronizar tudo
          </button>
        </div>
        <ul className="pub-grid">
          {CHANNELS.map(([name, n], i) => (
            <li key={name} className={`a-card pub-ch is-${st[i]}`}>
              <div className="pub-ch-top">
                <strong>{name}</strong>
                <span className="pub-dot" aria-label={st[i] === 'on' ? 'publicado' : 'fora do ar'} />
              </div>
              <p className="pub-ch-count">
                <b>{st[i] === 'on' ? n : 0}</b> publicados · {n} ativos
              </p>
              <div className="pub-ch-actions">
                <button
                  type="button"
                  className="a-btn"
                  disabled={st[i] !== 'off'}
                  onClick={() => {
                    touched.current = true;
                    publish(i);
                  }}
                >
                  {st[i] === 'busy' ? 'Enviando…' : 'Publicar todos'}
                </button>
                <button
                  type="button"
                  className="a-btn a-btn-quiet"
                  disabled={st[i] !== 'on'}
                  onClick={() => {
                    touched.current = true;
                    set(i, 'off');
                  }}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </AppWindow>
    </div>
  );
}
