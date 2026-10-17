import { useRef } from 'react';
import { CONFIG } from '../config';
import { int, useCount, useStart } from './app/AppWindow';
import './Proof.css';

function Stat({ value, label, run }) {
  const v = useCount(value, run, 1600);
  return (
    <div data-tilt="">
      <dt>{label}</dt>
      <dd>+{int(v)}</dd>
    </div>
  );
}

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

/* Prova: números e depoimentos vêm de CONFIG.proof. */
export default function Proof() {
  const { stats, testimonials, example } = CONFIG.proof;
  const ref = useRef(null);
  const run = useStart(ref, 450);
  return (
    <section id="prova" className="proof" aria-labelledby="proof-title">
      <div className="proof-head" data-reveal>
        <h2 id="proof-title" className="h2">
          <span className="mask">
            <span>Quem já usa</span>
          </span>
        </h2>
      </div>
      <dl className="proof-stats" ref={ref} data-reveal data-build style={{ '--rd': '120ms' }}>
        {stats.map((s) => (
          <Stat key={s.label} {...s} run={run} />
        ))}
      </dl>
      <div className="proof-quotes" data-reveal data-build style={{ '--rd': '220ms' }}>
        {testimonials.map((t) => (
          <figure key={t.name} className="proof-quote" data-tilt="">
            <span className="proof-mark" aria-hidden="true">
              “
            </span>
            <blockquote>{t.text}</blockquote>
            <figcaption>
              {t.photo ? (
                <img src={t.photo} alt="" className="proof-photo" />
              ) : (
                <span className="proof-photo" aria-hidden="true">
                  {initials(t.name)}
                </span>
              )}
              <span>
                <b>{t.name}</b>
                <small>{t.role}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      {example && (
        <p className="proof-note">Números e depoimentos de exemplo. Troque pelos reais antes de publicar.</p>
      )}
    </section>
  );
}
