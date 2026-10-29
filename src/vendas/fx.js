import { useEffect, useState } from 'react';

/* Efeitos da página de vendas (/vendas). Com "reduzir movimento" ligado no
   aparelho, só ficam os efeitos que não deslocam nada: aparecer, acender e
   contar. */

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Entradas ao rolar: [data-in] ganha .in na primeira vez que aparece. */
export function initReveal(root) {
  const items = root.querySelectorAll('[data-in]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((n) => n.classList.add('in'));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -10% 0px' },
  );
  items.forEach((n) => io.observe(n));
  return () => io.disconnect();
}

/** --p (0 → 1) em [data-scroll] enquanto o elemento atravessa a tela. */
export function initScrollVars(root) {
  if (reduceMotion()) return () => {};
  const els = [...root.querySelectorAll('[data-scroll]')];
  let raf = 0;
  const run = () => {
    raf = 0;
    const vh = window.innerHeight;
    for (const n of els) {
      const r = n.getBoundingClientRect();
      if (r.bottom < -vh || r.top > 2 * vh) continue;
      n.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
    }
  };
  const on = () => raf || (raf = requestAnimationFrame(run));
  run();
  window.addEventListener('scroll', on, { passive: true });
  window.addEventListener('resize', on);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', on);
    window.removeEventListener('resize', on);
  };
}

/**
 * Rolagem suave, com embalo, na roda do mouse. Teclado, barra de rolagem e
 * toque continuam com o navegador. Não age dentro de áreas que rolam sozinhas
 * nem nas pontas da página, para a rolagem passar adiante.
 */
export function initSmoothWheel() {
  if (reduceMotion() || !finePointer()) return () => {};
  const doc = document.documentElement;
  let target = window.scrollY;
  let current = target;
  let raf = 0;

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    doc.style.scrollBehavior = '';
  };
  const tick = () => {
    current += (target - current) * 0.11;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(0, current);
    if (current === target) return stop();
    raf = requestAnimationFrame(tick);
  };
  const innerScroller = (el, dy) => {
    for (; el && el !== document.body && el !== doc; el = el.parentElement) {
      const s = getComputedStyle(el);
      if (!/(auto|scroll)/.test(s.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };
  const onWheel = (e) => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0 || !(e.target instanceof Element) || innerScroller(e.target, e.deltaY)) return;
    if (!raf) target = current = window.scrollY;
    const step = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    const next = clamp(target + e.deltaY * step, 0, max);
    if (next === target) return;
    e.preventDefault();
    target = next;
    if (!raf) {
      doc.style.scrollBehavior = 'auto';
      raf = requestAnimationFrame(tick);
    }
  };
  const onScroll = () => {
    if (!raf) target = current = window.scrollY;
  };
  const cancel = () => raf && stop();

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', cancel);
  window.addEventListener('mousedown', cancel);
  return () => {
    stop();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', cancel);
    window.removeEventListener('mousedown', cancel);
  };
}

/**
 * Textos gigantes em faixa: [data-mq] guarda .v-mq-track com o texto repetido
 * 2x. A faixa anda sozinha (data-mq é a velocidade) e acelera com a rolagem.
 * Com data-curve, as letras entram subindo por uma curva no lado direito.
 */
export function initMarquees(root) {
  if (reduceMotion()) return () => {};
  const items = [...root.querySelectorAll('[data-mq]')].map((el) => ({
    el,
    track: el.querySelector('.v-mq-track'),
    curve: el.hasAttribute('data-curve'),
    speed: Number(el.dataset.mq) || 1,
    x: 0,
    half: 0,
    width: 0,
    size: 0,
    chars: [],
    visible: false,
  }));
  if (!items.length) return () => {};

  const measure = () => {
    for (const it of items) {
      it.half = it.track.scrollWidth / 2;
      it.width = it.el.clientWidth;
      it.size = parseFloat(getComputedStyle(it.track).fontSize);
      it.chars = it.curve
        ? [...it.track.querySelectorAll('.ch')].map((c) => ({
            c,
            mid: c.offsetLeft + c.offsetWidth / 2,
            bent: true,
          }))
        : [];
    }
  };
  const bend = (it) => {
    const start = it.width * 0.6;
    const span = it.width * 0.45;
    for (const ch of it.chars) {
      const u = (ch.mid - it.x - start) / span;
      if (u <= 0) {
        if (ch.bent) {
          ch.c.style.transform = '';
          ch.c.style.opacity = '';
          ch.bent = false;
        }
        continue;
      }
      const k = Math.min(u, 1.4);
      ch.c.style.transform = `translateY(${(k * k * 0.7 * it.size).toFixed(1)}px) rotate(${(k * 18).toFixed(1)}deg)`;
      ch.c.style.opacity = (1 - Math.min(k, 1) * 0.7).toFixed(2);
      ch.bent = true;
    }
  };

  let last = performance.now();
  let lastY = window.scrollY;
  let raf = 0;
  const frame = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    const boost = Math.min(Math.abs(window.scrollY - lastY), 80) * 0.6;
    lastY = window.scrollY;
    for (const it of items) {
      if (!it.visible || !it.half) continue;
      it.x = (it.x + (70 * dt + boost) * it.speed) % it.half;
      it.track.style.transform = `translate3d(${(-it.x).toFixed(1)}px, 0, 0)`;
      if (it.curve) bend(it);
    }
    raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      const it = items.find((i) => i.el === e.target);
      if (it) it.visible = e.isIntersecting;
    }),
  );
  items.forEach((it) => io.observe(it.el));
  measure();
  document.fonts?.ready.then(measure);
  window.addEventListener('resize', measure);
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('resize', measure);
  };
}

/** Brilho que segue o cursor dentro de [data-spot] (--mx, --my). */
export function initSpotlight(root) {
  if (!finePointer()) return () => {};
  const onMove = (e) => {
    const el = e.target instanceof Element && e.target.closest('[data-spot]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
    el.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
  };
  root.addEventListener('pointermove', onMove, { passive: true });
  return () => root.removeEventListener('pointermove', onMove);
}

/**
 * Respostas do FAQ abrem e fecham deslizando. O <details> continua nativo:
 * o evento toggle segue indo para o GA4.
 */
export function initAccordion(root) {
  if (reduceMotion()) return () => {};
  const onClick = (e) => {
    const summary = e.target instanceof Element && e.target.closest('.v-faq-list summary');
    if (!summary) return;
    const item = summary.parentElement;
    const body = item.querySelector('.v-faq-a');
    e.preventDefault();
    if (item.dataset.busy) return;
    item.dataset.busy = '1';
    const opening = !item.open;
    if (opening) item.open = true;
    const h = `${body.scrollHeight}px`;
    const frames = [
      { height: '0px', opacity: 0 },
      { height: h, opacity: 1 },
    ];
    const anim = body.animate(opening ? frames : frames.reverse(), {
      duration: 460,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
    anim.onfinish = () => {
      if (!opening) item.open = false;
      delete item.dataset.busy;
    };
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

/**
 * Seções presas na tela (passos e perfis) só quando a própria página rola.
 * Numa prévia que mostra a página inteira de uma vez, elas trocam sozinhas.
 */
export function usePinMode() {
  const [pin, setPin] = useState(false);
  useEffect(() => {
    if (reduceMotion()) return;
    const check = () => setPin(document.documentElement.scrollHeight > window.innerHeight * 1.6);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return pin;
}

/**
 * Chama onProgress(0 → 1) enquanto a seção rola. mode 'pin': 0 quando ela
 * encosta no topo, 1 quando termina. mode 'view': enquanto atravessa a tela.
 * onProgress precisa ser estável (useCallback).
 */
export function useScrollProgress(ref, active, onProgress, mode = 'pin') {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    let raf = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      onProgress(
        mode === 'pin' ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (vh + r.height)),
      );
    };
    const on = () => raf || (raf = requestAnimationFrame(run));
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [ref, active, onProgress, mode]);
}

/** Rola até o ponto `p` (0 → 1) de uma seção presa. */
export function scrollToProgress(el, p) {
  const r = el.getBoundingClientRect();
  const top = window.scrollY + r.top + p * (r.height - window.innerHeight);
  window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/** Troca automática a cada `ms` quando a seção não está presa. */
export function useAutoStep(active, count, ms, setIndex) {
  useEffect(() => {
    if (!active || reduceMotion()) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(t);
  }, [active, count, ms, setIndex]);
}
