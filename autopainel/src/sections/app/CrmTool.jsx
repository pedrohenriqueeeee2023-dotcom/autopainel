import { useEffect, useRef, useState } from 'react';
import AppWindow, { useStart } from './AppWindow';
import './CrmTool.css';

const STAGES = ['Novo', 'Em contato', 'Proposta', 'Negociação', 'Fechado'];

const LEADS = [
  {
    id: 1,
    name: 'Mariana Souza',
    want: 'SUV compacto 2023+ até R$ 150 mil',
    seller: 'Carlos',
    stage: 0,
    match: 'Hyundai Creta Platinum 2023 · R$ 149.900',
    src: 'site',
  },
  {
    id: 2,
    name: 'Patrícia Rocha',
    want: 'Hatch econômico até R$ 60 mil',
    seller: 'Ana',
    stage: 0,
    match: 'Renault Kwid Zen 2022 · R$ 54.900',
  },
  {
    id: 3,
    name: 'João Pereira',
    want: 'Toyota Corolla 2021+',
    seller: 'Ana',
    stage: 1,
    match: 'Toyota Corolla XEi 2022 · R$ 128.900',
    src: 'mercadolivre',
  },
  { id: 4, name: 'Lucas Martins', want: 'Honda Civic 2020+', seller: 'Bruno', stage: 1 },
  { id: 5, name: 'Fernanda Lima', want: 'Picape diesel', seller: 'Carlos', stage: 2 },
  {
    id: 6,
    name: 'Ricardo Alves',
    want: 'Jeep Compass',
    seller: 'Bruno',
    stage: 3,
    match: 'Jeep Compass Longitude 2023 · R$ 164.000',
    src: 'site',
  },
  { id: 7, name: 'Gabriela Costa', want: 'Fiat Toro', seller: 'Ana', stage: 4, src: 'olx' },
];
const MATCH_ORDER = [1, 3, 6, 2];

export default function CrmTool() {
  const ref = useRef(null);
  const start = useStart(ref);
  const [leads, setLeads] = useState(LEADS);
  const [shown, setShown] = useState([]); // ids com o "Chegou" visível
  const [toast, setToast] = useState(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    if (!start) return;
    MATCH_ORDER.forEach((id, i) => {
      timers.current.push(
        setTimeout(
          () => {
            setShown((s) => [...s, id]);
            const l = LEADS.find((x) => x.id === id);
            setToast({
              key: id,
              text: `Chegou ${l.match.split(' · ')[0]}`,
              who: `${l.seller}, ligue para ${l.name.split(' ')[0]}`,
            });
          },
          500 + i * 1100,
        ),
      );
    });
    timers.current.push(setTimeout(() => setToast(null), 500 + MATCH_ORDER.length * 1100 + 1800));
  }, [start]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const move = (id, stage) => setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));

  return (
    <div ref={ref}>
      <AppWindow active="crm">
        <div className="pg-head">
          <div>
            <h3 className="pg-title">CRM</h3>
            <p className="pg-sub">{leads.length} leads · arraste os cards entre as etapas</p>
          </div>
          <span className="a-btn a-btn-primary" aria-hidden="true">
            + Novo lead
          </span>
        </div>
        <div className="kanban" role="list">
          {STAGES.map((name, si) => {
            const col = leads.filter((l) => l.stage === si);
            return (
              <div
                key={name}
                role="listitem"
                className={`kb-col ${over === si ? 'is-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(si);
                }}
                onDragLeave={() => setOver((o) => (o === si ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag != null) move(drag, si);
                  setDrag(null);
                  setOver(null);
                }}
              >
                <div className="kb-col-head">
                  <span>{name}</span>
                  <b>{col.length}</b>
                </div>
                {col.map((l) => (
                  <article
                    key={l.id}
                    className={`kb-card ${drag === l.id ? 'is-drag' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(l.id));
                      setDrag(l.id);
                    }}
                    onDragEnd={() => {
                      setDrag(null);
                      setOver(null);
                    }}
                  >
                    <strong>{l.name}</strong>
                    <span className="kb-want">{l.want}</span>
                    <span className="kb-seller">Vendedor: {l.seller}</span>
                    {l.match && shown.includes(l.id) && <span className="kb-match">Chegou: {l.match}</span>}
                    <div className="kb-foot">
                      {l.src ? <span className="kb-src">{l.src}</span> : <span />}
                      {si < STAGES.length - 1 && (
                        <button
                          type="button"
                          className="kb-next"
                          onClick={() => move(l.id, si + 1)}
                          aria-label={`Mover ${l.name} para ${STAGES[si + 1]}`}
                        >
                          →
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            );
          })}
        </div>
        {toast && (
          <div className="kb-toast" key={toast.key} role="status">
            <span className="kb-toast-dot" />
            <div>
              <strong>{toast.text}</strong>
              <span>{toast.who}</span>
            </div>
          </div>
        )}
      </AppWindow>
    </div>
  );
}
