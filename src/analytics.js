import { CONFIG } from './config';

/**
 * Google Analytics 4. Só carrega quando CONFIG.analytics.ga4Id está
 * preenchido. Além das visitas, envia três eventos:
 * - clique_teste_gratis: botões que levam ao login do app
 * - clique_whatsapp: botão do WhatsApp
 * - ver_secao: primeira vez que cada seção aparece na tela
 * Todos levam `secao` (id da seção onde o clique aconteceu ou que apareceu).
 */
export function initAnalytics() {
  const id = CONFIG.analytics.ga4Id;
  if (!id) return () => {};

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  const track = (name, params) => window.gtag('event', name, params);
  const sectionOf = (el) => el.closest('section[id]')?.id || 'cabecalho';

  const onClick = (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const params = { secao: sectionOf(a), texto: a.textContent.trim().slice(0, 60) };
    if (href.includes('wa.me')) track('clique_whatsapp', params);
    else if (href.includes('autopainel.app.br')) track('clique_teste_gratis', params);
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
