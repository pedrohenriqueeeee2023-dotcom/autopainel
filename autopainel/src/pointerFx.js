/**
 * Interações de mouse da página (só com mouse e sem movimento reduzido):
 *  - um brilho suave segue o cursor;
 *  - [data-tilt] inclina na direção do cursor e acende onde ele está (--mx, --my);
 *  - botões são puxados de leve na direção do cursor (--tx, --ty);
 *  - a abertura recebe --hx e --hy (-1 a 1) para o painel acompanhar o mouse.
 */
const MAX_TILT = 3.5; // graus
const PULL = 0.14; // fração da distância até o centro do botão

export function initPointerFx(root) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!fine.matches || reduce.matches) return () => {};

  const glow = document.createElement('div');
  glow.className = 'ap-glow';
  glow.setAttribute('aria-hidden', 'true');
  root.appendChild(glow);

  const hero = root.querySelector('#topo');
  let tilt = null;
  let magnet = null;
  let last = null;
  let raf = 0;

  const release = (el) => {
    el.classList.remove('is-tilt');
    el.classList.add('tilt-out');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    setTimeout(() => el.classList.remove('tilt-out'), 600);
  };

  const frame = () => {
    raf = 0;
    const e = last;
    glow.style.translate = `${e.clientX}px ${e.clientY}px`;
    glow.classList.add('is-on');

    const t = e.target instanceof Element ? e.target : null;

    const nextTilt = t && t.closest('[data-tilt]');
    if (tilt && tilt !== nextTilt) release(tilt);
    tilt = nextTilt;
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tilt.classList.remove('tilt-out');
      tilt.classList.add('is-tilt');
      tilt.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
      tilt.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
      tilt.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      tilt.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    }

    const nextMag = t && t.closest('.btn, [data-magnet]');
    if (magnet && magnet !== nextMag) {
      magnet.style.setProperty('--tx', '0px');
      magnet.style.setProperty('--ty', '0px');
    }
    magnet = nextMag;
    if (magnet) {
      const r = magnet.getBoundingClientRect();
      magnet.style.setProperty('--tx', `${((e.clientX - r.left - r.width / 2) * PULL).toFixed(1)}px`);
      magnet.style.setProperty('--ty', `${((e.clientY - r.top - r.height / 2) * PULL).toFixed(1)}px`);
    }

    if (hero) {
      const r = hero.getBoundingClientRect();
      if (e.clientY < r.bottom) {
        hero.style.setProperty('--hx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        hero.style.setProperty('--hy', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }
    }
  };

  const onMove = (e) => {
    last = e;
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const onLeave = () => glow.classList.remove('is-on');

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    glow.remove();
  };
}
