import { useRef, useState } from 'react';
import AppWindow, { Icon, money, useStart } from './AppWindow';
import corolla from '../../assets/cars/corolla.jpg';
import hrv from '../../assets/cars/hrv.jpg';
import compass from '../../assets/cars/compass.jpg';
import tcross from '../../assets/cars/tcross.jpg';
import './StockTool.css';

const CARS = [
  {
    id: 1,
    img: corolla,
    name: 'Toyota Corolla',
    ver: 'XEi 2.0 · 2022 · Prata',
    plate: 'RTF-4E21',
    km: 38200,
    price: 128900,
    status: 'Disponível',
    days: 12,
    ads: 3,
  },
  {
    id: 2,
    img: hrv,
    name: 'Honda HR-V',
    ver: 'EXL · 2021 · Branco',
    plate: 'QWE-8A33',
    km: 51000,
    price: 119500,
    status: 'Reservado',
    days: 27,
    ads: 2,
  },
  {
    id: 3,
    img: compass,
    name: 'Jeep Compass',
    ver: 'Longitude · 2023 · Preto',
    plate: 'SDF-1B90',
    km: 22400,
    price: 164000,
    status: 'Disponível',
    days: 6,
    ads: 3,
  },
  {
    id: 4,
    img: tcross,
    name: 'VW T-Cross',
    ver: 'Highline · 2022 · Cinza',
    plate: 'PLK-7C12',
    km: 41800,
    price: 132000,
    status: 'Em preparação',
    days: 3,
    ads: 0,
  },
];
const STATUS = ['Todos', 'Disponível', 'Reservado', 'Em preparação', 'Vendido'];
const tone = { Disponível: 'ok', Reservado: 'warn', 'Em preparação': 'info', Vendido: 'sold' };

export default function StockTool() {
  const ref = useRef(null);
  const start = useStart(ref);
  const [cars, setCars] = useState(CARS);
  const [q, setQ] = useState('');
  const [f, setF] = useState('Todos');

  const k = q.trim().toLowerCase();
  const list = cars.filter(
    (c) =>
      (f === 'Todos' || c.status === f) && (!k || `${c.name} ${c.ver} ${c.plate}`.toLowerCase().includes(k)),
  );
  const sell = (id) =>
    setCars((cs) => cs.map((c) => (c.id === id ? { ...c, status: 'Vendido', ads: 0 } : c)));

  return (
    <div ref={ref} className={start ? 'is-on' : undefined}>
      <AppWindow active="stock">
        <div className="pg-head">
          <div>
            <h3 className="pg-title">Estoque</h3>
            <p className="pg-sub">
              {list.length} {list.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
            </p>
          </div>
          <span className="a-btn a-btn-primary" aria-hidden="true">
            + Novo veículo
          </span>
        </div>
        <div className="st-filters">
          <label className="a-input st-search">
            <Icon name="search" className="a-btn-ico" />
            <input
              placeholder="Buscar marca, modelo, placa…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar no estoque"
            />
          </label>
          <div className="st-chips" role="group" aria-label="Filtrar por status">
            {STATUS.map((s) => (
              <button
                key={s}
                type="button"
                className={`a-chip ${f === s ? 'on' : ''}`}
                onClick={() => setF(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="a-card st-table">
          <div className="st-row st-th" aria-hidden="true">
            <span>Veículo</span>
            <span>Placa</span>
            <span>KM</span>
            <span>Preço</span>
            <span>Status</span>
            <span>Dias</span>
            <span>Anúncios</span>
            <span />
          </div>
          {list.map((c, i) => (
            <div key={c.id} className="st-row" style={{ '--i': i }}>
              <span className="st-car">
                <img src={c.img} alt={`${c.name} ${c.ver}`} width="64" height="40" />
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.ver}</small>
                </span>
              </span>
              <span className="st-mono">{c.plate}</span>
              <span>{c.km.toLocaleString('pt-BR')} km</span>
              <span className="st-price">{money(c.price)}</span>
              <span>
                <span className={`a-tag ${tone[c.status]}`}>{c.status}</span>
              </span>
              <span className="st-meta">
                <em>Dias</em>
                {c.days}
              </span>
              <span className="st-meta">
                <em>Anúncios</em>
                {c.ads}
              </span>
              <span className="st-act">
                <button
                  type="button"
                  className="a-btn"
                  disabled={c.status === 'Vendido'}
                  onClick={() => sell(c.id)}
                >
                  {c.status === 'Vendido' ? 'Vendido' : 'Vender'}
                </button>
              </span>
            </div>
          ))}
          {!list.length && <p className="st-empty">Nenhum carro com esse filtro.</p>}
        </div>
      </AppWindow>
    </div>
  );
}
