import { Suspense, useEffect, useRef, useState } from 'react';

/** Pede para todas as seções adiadas montarem (usado por links internos). */
export const LOAD_ALL = 'ap:load-all';

/**
 * Monta a seção só quando ela se aproxima da tela. Até lá fica um espaço
 * reservado com o `id` da seção, para os links internos encontrarem o lugar.
 * Use com componentes de React.lazy: o código e o CSS da seção só baixam aqui.
 */
export default function Defer({ id, height = '100vh', children }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (on) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), {
      rootMargin: '900px 0px',
    });
    io.observe(ref.current);
    const all = () => setOn(true);
    window.addEventListener(LOAD_ALL, all);
    return () => {
      io.disconnect();
      window.removeEventListener(LOAD_ALL, all);
    };
  }, [on]);

  const slot = <div ref={ref} id={id} className="defer-slot" style={{ minHeight: height }} />;
  return on ? <Suspense fallback={slot}>{children}</Suspense> : slot;
}
