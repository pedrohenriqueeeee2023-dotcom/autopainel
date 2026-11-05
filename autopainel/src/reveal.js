/**
 * Entradas automáticas.
 *
 *  [data-reveal] ganha .is-in quando já está bem dentro da tela (o CSS faz a
 *                entrada, com atraso em --rd).
 *  [data-build]  cada filho recebe --k para entrar na sua vez.
 *
 * Seções carregadas depois (ver Defer.jsx) são observadas assim que entram no
 * DOM. A página também recebe --page (0 a 1) para a barra de progresso do topo.
 */
export function initReveal(root) {
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const scan = (scope) => {
    const all = (sel) => [...(scope.matches?.(sel) ? [scope] : []), ...scope.querySelectorAll(sel)];
    all('[data-build]').forEach((el) =>
      Array.from(el.children).forEach((c, k) => c.style.setProperty('--k', k)),
    );
    all('[data-reveal]:not(.is-in)').forEach((n) =>
      reduce.matches ? n.classList.add('is-in') : io.observe(n),
    );
  };

  const mo = new MutationObserver((list) =>
    list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n))),
  );
  mo.observe(root, { childList: true, subtree: true });
  scan(root);

  let raf = 0;
  const update = () => {
    raf = 0;
    const doc = html.scrollHeight - window.innerHeight;
    html.style.setProperty('--page', doc > 0 ? Math.min(1, window.scrollY / doc).toFixed(4) : '0');
    // No fim da página, o que ficou na faixa de baixo da tela também entra.
    if (window.scrollY >= doc - 4)
      root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((n) => {
        if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add('is-in');
      });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    mo.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}
