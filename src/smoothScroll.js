/**
 * Rolagem suave com inércia leve para mouse/trackpad.
 *
 * A roda do mouse não pula direto: movemos um alvo e a página o alcança aos
 * poucos (interpolação por quadro). Teclado, barra de rolagem e toque seguem
 * nativos. Desligado com prefers-reduced-motion e em telas de toque.
 */
const EASE = 0.075;
// Cada giro da roda anda um pouco mais que o nativo, e a página desliza até lá.
const STEP = 1.6;

import { LOAD_ALL } from './Defer';

/** Espera as seções adiadas montarem antes de medir a posição do link. */
const whenMounted = (id, done, tries = 90) => {
  const el = document.getElementById(id);
  const pending = document.querySelector('.defer-slot');
  if ((el && !pending) || tries <= 0) done(el);
  else requestAnimationFrame(() => whenMounted(id, done, tries - 1));
};

export function initSmoothScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');
  let target = window.scrollY;
  let current = window.scrollY;
  let raf = 0;

  const max = () => document.documentElement.scrollHeight - window.innerHeight;

  const tick = () => {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo({ top: current, behavior: 'instant' });
    raf = current === target ? 0 : requestAnimationFrame(tick);
  };

  const animateTo = (y) => {
    target = Math.max(0, Math.min(max(), y));
    if (!raf) {
      current = window.scrollY;
      raf = requestAnimationFrame(tick);
    }
  };

  const scrollable = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const o = getComputedStyle(n).overflowY;
      if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return true;
    }
    return false;
  };

  const onWheel = (e) => {
    if (reduce.matches || !fine.matches || e.ctrlKey || scrollable(e.target)) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    animateTo((raf ? target : window.scrollY) + e.deltaY * unit * STEP);
  };

  // Rolagem por outras vias (teclado, barra) interrompe a animação.
  const onScroll = () => {
    if (!raf) target = current = window.scrollY;
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    target = current = window.scrollY;
  };

  // Âncoras internas (#secao): monta as seções que faltam e desliza até lá.
  const onClick = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    window.dispatchEvent(new Event(LOAD_ALL));
    whenMounted(id, (el) => {
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY;
      if (reduce.matches) window.scrollTo(0, y);
      else animateTo(y);
    });
  };

  // Chegou com #secao na URL: monta tudo e vai direto para a seção.
  const hash = window.location.hash.slice(1);
  if (hash && /^[\w-]+$/.test(hash)) {
    window.dispatchEvent(new Event(LOAD_ALL));
    whenMounted(hash, (el) => el && window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', stop);
  window.addEventListener('mousedown', stop);
  document.addEventListener('click', onClick);

  return () => {
    stop();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', stop);
    window.removeEventListener('mousedown', stop);
    document.removeEventListener('click', onClick);
  };
}
