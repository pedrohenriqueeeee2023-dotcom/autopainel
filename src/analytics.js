import { CONFIG } from './config';

/**
 * Eventos do Google Analytics 4. A tag (gtag.js) fica no index.html, para o
 * Google detectá-la direto no HTML. Além das visitas, envia três eventos:
 * - clique_oferta: botões da oferta de cliente projeto (abrem o WhatsApp)
 * - clique_whatsapp: outros links do WhatsApp
 * - ver_secao: primeira vez que cada seção aparece na tela
 * Todos levam `secao` (id da seção onde o clique aconteceu ou que apareceu).
 */
export function initAnalytics() {
  if (typeof window.gtag !== 'function') return () => {};

  const track = (name, params) => window.gtag('event', name, params);
  const sectionOf = (el) => el.closest('section[id]')?.id || 'cabecalho';

  const onClick = (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const params = { secao: sectionOf(a), texto: a.textContent.trim().slice(0, 60) };
    if (href === CONFIG.ctas.trial.href) track('clique_oferta', params);
    else if (href.includes('wa.me')) track('clique_whatsapp', params);
  };
  document.addEventListener('click', onClick);

  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        const sid = en.target.id;
        if (!en.isIntersecting || seen.has(sid)) return;
        seen.add(sid);
        track('ver_secao', { secao: sid });
        io.unobserve(en.target);
      }),
    { rootMargin: '-45% 0px -45% 0px' },
  );
  const watch = () => document.querySelectorAll('section[id]').forEach((el) => io.observe(el));
  watch();
  // Seções carregadas depois (Defer) entram no observador quando montam.
  const mo = new MutationObserver(watch);
  mo.observe(document.getElementById('root'), { childList: true, subtree: true });

  return () => {
    document.removeEventListener('click', onClick);
    io.disconnect();
    mo.disconnect();
  };
}
