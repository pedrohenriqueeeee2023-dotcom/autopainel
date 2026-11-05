import { useEffect, useRef, useState } from 'react';
import { Icon } from './app/AppWindow';
import './Solved.css';

/* "O que resolvemos?": uma linha à esquerda carrega conforme a página desce. Cada
   problema aparece legível; o risco só entra quando o próximo aparece, e aí a
   solução surge embaixo. */
const PROBLEMS = [
  ['pub', 'Cadastrar o mesmo carro em cada site', 'Cadastre uma vez e publique em 8 canais.'],
  ['crm', 'Esquecer o cliente que pediu um carro', 'O vendedor é avisado quando o carro chega.'],
  ['eval', 'Comprar na troca sem saber o valor', 'A placa mostra até quanto pagar.'],
  ['stock', 'Carro parado no pátio sem ninguém ver', 'Dias de pátio e anúncios de cada carro.'],
  ['fin', 'Fechar o mês sem saber as comissões', 'Comissões e caixa calculados no painel.'],
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
      // A ponta da linha acompanha 65% da altura da tela.
      const v = (window.innerHeight * 0.65 - r.top) / r.height;
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
  const at = (i) => (i + 0.2) / n;

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
          {PROBLEMS.map(([ico, problem, fix], i) => {
            const on = p >= at(i);
            // O risco só entra quando a próxima frase já apareceu inteira.
            const struck = i + 1 < n ? p >= at(i + 1) : done;
            return (
              <li key={problem} className={`${on ? 'is-on' : ''} ${struck ? 'is-struck' : ''}`}>
                <span className="solved-dot" aria-hidden="true" />
                <span className="solved-ico" aria-hidden="true">
                  <Icon name={ico} />
                </span>
                <div className="solved-txt">
                  <s>{problem}</s>
                  <p className="solved-fix">
                    <span aria-hidden="true">✓</span> {fix}
                  </p>
                </div>
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
