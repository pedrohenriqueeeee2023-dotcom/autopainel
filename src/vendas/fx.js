import { useEffect, useState } from 'react';

/* Efeitos da página de vendas (/vendas). Com "reduzir movimento" ligado no
   aparelho, só ficam os efeitos que não deslocam nada: aparecer, acender,
   contar e trocar de conteúdo.

   Tudo o que depende da rolagem lê a posição do elemento na tela a cada
   quadro, enquanto ele está visível. Assim funciona em qualquer lugar onde a
   página for aberta (navegador, app, prévia dentro de outra página). */

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Chama fn a cada quadro enquanto el está na tela (ou perto dela). */
function whileVisible(el, fn) {
  let raf = 0;
  let visible = false;
  const loop = () => {
    fn();
    raf = visible ? requestAnimationFrame(loop) : 0;
  };
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    },
    { rootMargin: '25% 0px' },
  );
  io.observe(el);
  fn();
  return () => {
    visible = false;
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

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
  const stops = [...root.querySelectorAll('[data-scroll]')].map((n) =>
    whileVisible(n, () => {
      const r = n.getBoundingClientRect();
      const vh = window.innerHeight;
      n.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
    }),
  );
  return () => stops.forEach((s) => s());
}

/**
 * Cortina: a primeira seção de .v-curtain gruda quando o pé dela chega ao pé
 * da tela (--stick), e a seguinte sobe por cima.
 */
export function initCurtains(root) {
  const els = [...root.querySelectorAll('.v-curtain > :first-child')];
  const set = () =>
    els.forEach((el) =>
      el.style.setProperty('--stick', `${Math.min(0, window.innerHeight - el.offsetHeight)}px`),
    );
  const ro = new ResizeObserver(set);
  els.forEach((el) => ro.observe(el));
  window.addEventListener('resize', set);
  set();
  return () => {
    ro.disconnect();
    window.removeEventListener('resize', set);
  };
}

/* Guia de rolagem: os pontos onde a página para (início de cada seção com
   data-snap e cada passo das seções presas, data-lock = número de passos). */
/* Posição na página. A primeira seção de uma cortina gruda na tela, então a
   posição dela é medida pelo bloco que a envolve. */
const absTop = (el) => {
  const box = el.parentElement?.classList.contains('v-curtain') && !el.previousElementSibling;
  return (box ? el.parentElement : el).getBoundingClientRect().top + window.scrollY;
};
function lockZones(root) {
  const vh = window.innerHeight;
  return [...root.querySelectorAll('[data-lock]')]
    .map((el) => {
      const n = Number(el.dataset.lock);
      const top = absTop(el);
      const range = el.offsetHeight - vh;
      return {
        top,
        end: top + range,
        // Fim da seção = começo da seguinte. Entre end e bottom a seção sai da tela.
        bottom: top + el.offsetHeight,
        points: Array.from({ length: n }, (_, i) => top + (range * i) / Math.max(1, n - 1)),
      };
    })
    .filter((z) => z.end > z.top);
}
const snapPoints = (root) => [...root.querySelectorAll('[data-snap]')].map(absTop);

/* Velocidade da roda (px/s) a partir da qual os encaixes deixam de segurar:
   rolar rápido passa direto pelos passos das seções presas. */
const FAST = 3000;

/**
 * Guia de rolagem (só com movimento liberado), dinâmico:
 *  - direciona: parou perto do começo de uma seção, a página desliza até ela;
 *  - encaixa: nas seções presas, rolar com calma para em cada passo; o
 *    próximo gesto já segue, e rolar rápido passa direto;
 *  - completa: parou no meio de uma seção presa, a página termina o
 *    movimento até o passo seguinte, no sentido em que a pessoa vinha.
 * A roda do mouse rola com embalo; toque e teclado seguem o navegador (o
 * teclado anda de passo em passo nas seções presas). Links internos
 * (#como, #perfis...) deslizam até a seção.
 */
export function initScrollGuide(root) {
  if (reduceMotion()) return () => {};
  const doc = document.documentElement;
  const fine = finePointer();
  let target = window.scrollY;
  let current = target;
  let lerp = 0; // rolagem com embalo (roda do mouse)
  let anim = 0; // deslize até um ponto
  let glideTo = null;
  let lastWheel = 0;
  let recent = []; // [tempo, px] da roda nos últimos 150 ms
  let hold = null; // encaixe segurando a rolagem: { p, push }
  let lastY = window.scrollY;
  let lastDir = 1;
  let lastInput = '';
  let touching = false;
  let settle = 0;
  let expect = null; // posição que o próprio guia acabou de pedir

  const maxY = () => doc.scrollHeight - window.innerHeight;
  // Inclui o trecho em que a seção presa sai da tela (até o começo da seguinte).
  const zoneAt = (y) => lockZones(root).find((z) => y >= z.top - 2 && y < z.bottom - 2);
  /** Encaixes: cada passo das seções presas e o começo da seção seguinte. */
  const detents = () =>
    lockZones(root)
      .flatMap((z) => [...z.points, z.bottom])
      .sort((a, b) => a - b);

  const release = () => {
    if (!lerp && !anim) doc.style.scrollBehavior = '';
  };
  const stopLerp = () => {
    cancelAnimationFrame(lerp);
    lerp = 0;
    release();
  };
  const stopGlide = () => {
    cancelAnimationFrame(anim);
    anim = 0;
    glideTo = null;
    release();
  };

  /** Desliza até y. Os links usam uma curva mais suave nas duas pontas. */
  const glide = (to, kind) => {
    stopLerp();
    stopGlide();
    to = clamp(to, 0, Math.max(0, maxY()));
    const from = window.scrollY;
    const d = to - from;
    if (Math.abs(d) < 1) return;
    const dur = clamp(380 + Math.abs(d) * 0.3, 450, kind === 'nav' ? 1100 : 900);
    const t0 = performance.now();
    glideTo = to;
    doc.style.scrollBehavior = 'auto';
    const frame = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e =
        kind === 'nav' ? (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) : 1 - Math.pow(1 - k, 3);
      expect = from + d * e;
      window.scrollTo(0, expect);
      if (k < 1) {
        anim = requestAnimationFrame(frame);
        return;
      }
      anim = 0;
      glideTo = null;
      target = current = lastY = to;
      release();
    };
    anim = requestAnimationFrame(frame);
  };

  /** Próximo (dir 1) ou anterior (dir -1) ponto de parada a partir de y. */
  const nextStop = (y, dir) => {
    const list = [...snapPoints(root), ...detents()].sort((a, b) => a - b);
    return dir > 0 ? list.find((p) => p > y + 4) : [...list].reverse().find((p) => p < y - 4);
  };

  /** A rolagem parou: completa o passo (seção presa) ou puxa para a seção perto. */
  const onSettle = () => {
    if (anim || lerp || touching) return;
    if (lastInput !== 'wheel' && lastInput !== 'touch') return;
    const y = window.scrollY;
    const z = zoneAt(y);
    if (z) {
      const pts = [...z.points, z.bottom];
      const a = [...pts].reverse().find((p) => p <= y);
      const b = pts.find((p) => p > y);
      if (a === undefined || b === undefined || y - a < 2) return;
      if (b - y < 2) return glide(b);
      // Basta um pouco de movimento num sentido para o passo seguinte vir.
      const frac = (y - a) / (b - a);
      glide(lastDir > 0 ? (frac > 0.1 ? b : a) : frac < 0.9 ? a : b);
      return;
    }
    // Ímã: começo das seções e primeiro/último passo das seções presas.
    const list = [...snapPoints(root), ...lockZones(root).flatMap((s) => [s.top, s.end])].sort(
      (a, b) => a - b,
    );
    const vh = window.innerHeight;
    const ahead = lastDir > 0 ? list.find((s) => s > y + 2) : [...list].reverse().find((s) => s < y - 2);
    const behind = lastDir > 0 ? [...list].reverse().find((s) => s <= y - 2) : list.find((s) => s >= y + 2);
    if (ahead !== undefined && Math.abs(ahead - y) < vh * 0.35) glide(ahead);
    else if (behind !== undefined && Math.abs(behind - y) < vh * 0.08) glide(behind);
  };
  const scheduleSettle = () => {
    clearTimeout(settle);
    settle = setTimeout(onSettle, 160);
  };

  const tickLerp = () => {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.5) current = target;
    expect = current;
    window.scrollTo(0, current);
    if (current === target) {
      lerp = 0;
      release();
      scheduleSettle();
      return;
    }
    lerp = requestAnimationFrame(tickLerp);
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
    if (!fine || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (maxY() <= 0 || !(e.target instanceof Element) || innerScroller(e.target, e.deltaY)) return;
    const dir = Math.sign(e.deltaY);
    if (!dir) return;
    const now = performance.now();
    const delta = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
    const newGesture = now - lastWheel > 160;
    lastWheel = now;
    lastInput = 'wheel';
    if (dir !== lastDir) hold = null;
    lastDir = dir;
    recent = recent.filter(([t]) => now - t < 150);
    recent.push([now, Math.abs(delta)]);
    const speed = recent.reduce((sum, [, d]) => sum + d, 0) / 0.15;
    // Voltou a rolar: o deslize em andamento para e a pessoa assume.
    if (anim) stopGlide();
    if (!lerp) target = current = window.scrollY;
    let next = clamp(target + delta, 0, maxY());
    // Encaixe: segura até um gesto novo (ou um empurrão longo no mesmo gesto).
    if (hold) {
      hold.push += Math.abs(delta);
      if (newGesture || hold.push > window.innerHeight * 0.5) hold = null;
      else next = hold.p;
    }
    if (!hold && speed < FAST) {
      const list = detents();
      const p =
        dir > 0
          ? list.find((s) => s > target + 1 && s <= next)
          : [...list].reverse().find((s) => s < target - 1 && s >= next);
      if (p !== undefined) {
        next = p;
        hold = { p, push: 0 };
      }
    }
    if (next === target) {
      // Na ponta da página, deixa a rolagem passar adiante (página dentro de outra).
      if (lerp || hold) e.preventDefault();
      return;
    }
    e.preventDefault();
    target = next;
    if (!lerp) {
      doc.style.scrollBehavior = 'auto';
      lerp = requestAnimationFrame(tickLerp);
    }
  };

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    if (dy) lastDir = Math.sign(dy);
    // A página foi rolada por outro meio (barra, script) durante um deslize: o guia cede.
    if ((anim || lerp) && expect !== null && Math.abs(y - Math.min(expect, maxY())) > 3) {
      stopGlide();
      stopLerp();
      hold = null;
    }
    if (anim || lerp) return;
    target = current = y;
    scheduleSettle();
  };

  const onKey = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    lastInput = 'key';
    hold = null;
    if (lerp) stopLerp();
    const k = e.key;
    const dir =
      k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)
        ? 1
        : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)
          ? -1
          : 0;
    if (!dir || !(e.target instanceof Element)) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (k === ' ' && e.target.closest('a, button, summary')) return;
    // Nas seções presas, cada tecla vai a um passo; apertar de novo já segue.
    const from = glideTo ?? window.scrollY;
    if (!zoneAt(from)) return;
    e.preventDefault();
    const to = nextStop(from, dir);
    if (to !== undefined) glide(to);
  };

  const onTouchStart = () => {
    touching = true;
    lastInput = 'touch';
    hold = null;
    if (anim) stopGlide();
    if (lerp) stopLerp();
  };
  const onTouchEnd = () => {
    touching = false;
    scheduleSettle();
  };

  // Links internos deslizam até a seção (também os do indicador lateral).
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target instanceof Element && e.target.closest('a[href^="#"]:not(.ap-skip)');
    const id = a ? a.getAttribute('href').slice(1) : '';
    const el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    lastInput = 'nav';
    hold = null;
    glide(absTop(el), 'nav');
    history.replaceState(null, '', `#${id}`);
    // Como num link normal, o próximo Tab continua a partir da seção.
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  const onPointer = () => {
    lastInput = 'pointer';
    hold = null;
    if (lerp) stopLerp();
    if (anim) stopGlide();
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('mousedown', onPointer);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  document.addEventListener('click', onClick);
  return () => {
    stopLerp();
    stopGlide();
    clearTimeout(settle);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('mousedown', onPointer);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    document.removeEventListener('click', onClick);
  };
}

/**
 * Seção atual para o indicador lateral: dispara 'v-guide' no document com
 * { id, step, n } (n = passos da seção presa) sempre que muda. Também marca
 * o <html> com .v-scrolled depois do primeiro movimento (esconde a dica).
 */
export function initSectionTracker(root) {
  let last = '';
  let raf = 0;
  const run = () => {
    raf = 0;
    const vh = window.innerHeight;
    let cur = null;
    for (const el of root.querySelectorAll('[data-snap]')) {
      if (el.getBoundingClientRect().top <= vh * 0.45) cur = el;
    }
    document.documentElement.classList.toggle('v-scrolled', window.scrollY > 40);
    if (!cur) return;
    const n = Number(cur.dataset.lock) || 0;
    let step = 0;
    if (n) {
      const r = cur.getBoundingClientRect();
      step = Math.round(clamp(-r.top / Math.max(1, r.height - vh)) * (n - 1));
    }
    const key = `${cur.id}:${step}:${n}`;
    if (key === last) return;
    last = key;
    document.dispatchEvent(new CustomEvent('v-guide', { detail: { id: cur.id, step, n } }));
  };
  const on = () => raf || (raf = requestAnimationFrame(run));
  run();
  window.addEventListener('scroll', on, { passive: true });
  window.addEventListener('resize', on);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', on);
    window.removeEventListener('resize', on);
    document.documentElement.classList.remove('v-scrolled');
  };
}

/* Velocidade (px/s) com que a faixa segue sozinha depois que a rolagem para. */
const CRUISE = 55;

/**
 * Textos gigantes em faixa: [data-mq] guarda .v-mq-track com o texto repetido
 * 2x (data-mq é a velocidade). A faixa fica parada até a primeira rolagem,
 * anda junto com a rolagem e, quando ela para, continua sozinha no mesmo
 * sentido. Com data-curve, as letras entram subindo por uma curva à direita.
 */
export function initMarquees(root) {
  if (reduceMotion()) return () => {};
  const stops = [...root.querySelectorAll('[data-mq]')].map((el) => {
    const it = {
      track: el.querySelector('.v-mq-track'),
      curve: el.hasAttribute('data-curve'),
      speed: Number(el.dataset.mq) || 1,
      x: 0,
      v: 0,
      dir: 1,
      started: false,
      last: 0,
      lastTop: 0,
      half: 0,
      width: 0,
      size: 0,
      chars: [],
    };
    const measure = () => {
      it.half = it.track.scrollWidth / 2;
      it.width = el.clientWidth;
      it.size = parseFloat(getComputedStyle(it.track).fontSize);
      it.chars = it.curve
        ? [...it.track.querySelectorAll('.ch')].map((c) => ({
            c,
            mid: c.offsetLeft + c.offsetWidth / 2,
            bent: true,
          }))
        : [];
    };
    const bend = () => {
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
        ch.c.style.transform = `translateY(${(k * k * 0.5 * it.size).toFixed(1)}px) rotate(${(k * 16).toFixed(1)}deg)`;
        ch.c.style.opacity = (1 - Math.min(k, 1) * 0.7).toFixed(2);
        ch.bent = true;
      }
    };
    const frame = () => {
      const now = performance.now();
      const top = el.getBoundingClientRect().top;
      const gap = now - it.last;
      // Voltou a aparecer depois de um tempo fora da tela: recomeça a medida.
      const moved = gap > 120 ? 0 : it.lastTop - top;
      const dt = gap > 120 ? 0 : gap / 1000;
      it.last = now;
      it.lastTop = top;
      if (Math.abs(moved) > 0.3) {
        it.started = true;
        it.dir = Math.sign(moved);
        it.x += moved * 0.9 * it.speed;
        if (dt) it.v = Math.min(Math.abs(moved) / dt, 1500);
      } else if (it.started && dt) {
        it.v += (CRUISE - it.v) * Math.min(1, dt * 2);
        it.x += it.dir * it.v * dt * it.speed;
      }
      if (!it.half) return;
      it.x = ((it.x % it.half) + it.half) % it.half;
      it.track.style.transform = `translate3d(${(-it.x).toFixed(1)}px, 0, 0)`;
      if (it.curve) bend();
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    const stop = whileVisible(el, frame);
    return () => {
      stop();
      window.removeEventListener('resize', measure);
    };
  });
  return () => stops.forEach((s) => s());
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
 * Seções presas na tela (passos e perfis) só quando a própria página rola e
 * a tela tem altura para mostrar tudo. Senão, elas trocam sozinhas.
 */
export function usePinMode() {
  const [pin, setPin] = useState(false);
  useEffect(() => {
    if (reduceMotion()) return;
    const check = () =>
      setPin(window.innerHeight >= 540 && document.documentElement.scrollHeight > window.innerHeight * 1.6);
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
    return whileVisible(el, () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      onProgress(
        mode === 'pin' ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (vh + r.height)),
      );
    });
  }, [ref, active, onProgress, mode]);
}

/** Rola até o ponto `p` (0 → 1) de uma seção presa. */
export function scrollToProgress(el, p) {
  const r = el.getBoundingClientRect();
  const top = window.scrollY + r.top + p * (r.height - window.innerHeight);
  window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/** true enquanto o elemento está na tela (rootMargin amplia a área). */
export function useInView(ref, rootMargin = '0px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin,
      threshold: 0.3,
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/** Troca automática a cada `ms` (passos, perfis) quando a seção não está presa. */
export function useAutoStep(active, count, ms, setIndex) {
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(t);
  }, [active, count, ms, setIndex]);
}
