import { useEffect, useRef, useState } from 'react';
import { Icon } from './app/AppWindow';
import './Solved.css';

/* "O que resolvemos?": uma linha no meio carrega conforme a página desce. Cada
   problema aparece de um lado quando a linha chega nele e leva um risco. */
const PROBLEMS = [
  ['pub', 'Cadastrar o mesmo carro em cada site'],
  ['crm', 'Esquecer o cliente que pediu um carro'],
  ['eval', 'Comprar na troca sem saber o valor'],
  ['stock', 'Carro parado no pátio sem ninguém ver'],
  ['fin', 'Fechar o mês sem saber as comissões'],
];

export default function Solved() {
  const track = useRef(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setP(1);
      return undefined;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = track.current.getBoundingClientRect();
      // A ponta da linha acompanha 62% da altura da tela.
      const v = (window.innerHeight * 0.62 - r.top) / r.height;
      setP(Math.max(0, Math.min(1, v)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const n = PROBLEMS.length;
  const done = p >= 0.98;

  return (
    <section id="resolvemos" className="solved" aria-labelledby="solved-title">
      <div className="solved-head" data-reveal>
        <h2 id="solved-title" className="h2">
          <span className="mask">
            <span>
              O que <em className="kw">resolvemos?</em>
            </span>
          </span>
        </h2>
      </div>
      <div className="solved-track" ref={track} style={{ '--p': p }}>
        <span className="solved-line" aria-hidden="true">
          <span />
        </span>
        <ul className="solved-list">
          {PROBLEMS.map(([ico, t], i) => {
            const at = (i + 0.5) / n;
            return (
              <li key={t} className={p >= at ? 'is-on' : ''} style={{ '--at': at }}>
                <span className="solved-dot" aria-hidden="true" />
                <span className="solved-ico" aria-hidden="true">
                  <Icon name={ico} />
                </span>
                <s>{t}</s>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={`solved-end ${done ? 'is-on' : ''}`}>
        <a className="btn btn-accent btn-lg solved-btn" href="#app" data-magnet="">
          <span className="solved-check" aria-hidden="true">
            ✓
          </span>
          Tudo resolvido
        </a>
      </div>
    </section>
  );
}
