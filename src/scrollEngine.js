/**
 * Motor de rolagem sem dependências.
 *
 * Cada `[data-scene]` é uma cena alta com um palco fixo (sticky). A cada quadro
 * calculamos o progresso da cena (0 → 1) e o repassamos aos elementos como
 * variáveis CSS — o CSS faz todo o trabalho visual, sem re-render do React.
 *
 *  data-r="a b"  → --t vai de 0 a 1 entre os progressos a e b (entrada)
 *  data-o="a b"  → --u vai de 0 a 1 entre a e b (saída)
 *  data-at="x"   → recebe a classe .is-on quando o progresso passa de x
 *
 * A cena recebe --p e data-step (quantidade de [data-at] ativos).
 * Seções comuns usam [data-reveal] (IntersectionObserver).
 */
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const range = (s) => s.split(/[\s,]+/).map(Number);

export function initScrollEngine(root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const html = document.documentElement;
  let scenes = [];
  let raf = 0;

  const collect = () => {
    scenes = Array.from(root.querySelectorAll('[data-scene]')).map((el) => ({
      el,
      last: -1,
      r: Array.from(el.querySelectorAll('[data-r]')).map((n) => ({ n, a: range(n.dataset.r), v: -1 })),
      o: Array.from(el.querySelectorAll('[data-o]')).map((n) => ({ n, a: range(n.dataset.o), v: -1 })),
      at: Array.from(el.querySelectorAll('[data-at]')).map((n) => ({ n, x: Number(n.dataset.at), on: null })),
    }));
  };

  const set = (item, prop, v) => {
    if (Math.abs(item.v - v) < 0.0005) return;
    item.v = v;
    item.n.style.setProperty(prop, v.toFixed(4));
  };

  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    const doc = html.scrollHeight - vh;
    html.style.setProperty('--page', doc > 0 ? clamp(window.scrollY / doc).toFixed(4) : '0');
    for (const s of scenes) {
      const rect = s.el.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) continue;
      const total = Math.max(1, s.el.offsetHeight - vh);
      const p = clamp(-rect.top / total);
      if (Math.abs(p - s.last) < 0.0003) continue;
      s.last = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      for (const it of s.r) set(it, '--t', clamp((p - it.a[0]) / (it.a[1] - it.a[0])));
      for (const it of s.o) set(it, '--u', clamp((p - it.a[0]) / (it.a[1] - it.a[0])));
      let step = 0;
      for (const it of s.at) {
        const on = p >= it.x;
        if (on) step++;
        if (on !== it.on) {
          it.on = on;
          it.n.classList.toggle('is-on', on);
        }
      }
      if (s.el.dataset.step !== String(step)) s.el.dataset.step = String(step);
    }
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  // Modo estático: sem animação ligada à rolagem; tudo no estado final.
  const applyStatic = () => {
    html.classList.add('ap-static');
    root.querySelectorAll('[data-at]').forEach((n) => n.classList.add('is-on'));
    root.querySelectorAll('[data-scene]').forEach((n) => (n.dataset.step = '99'));
  };

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -12% 0px' },
  );

  const start = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduce.matches) {
      applyStatic();
      root.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('is-in'));
      return;
    }
    html.classList.remove('ap-static');
    collect();
    scenes.forEach((s) => (s.last = -1));
    root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((n) => io.observe(n));
    update();
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reduce.addEventListener('change', start);
  start();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    reduce.removeEventListener('change', start);
  };
}
