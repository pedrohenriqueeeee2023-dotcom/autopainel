import { CONFIG } from './config';

/**
 * Eventos do Google Analytics 4. A tag (gtag.js) fica no index.html, para o
 * Google detectá-la direto no HTML. Eventos enviados (todos com `secao` quando
 * fazem sentido, o id da seção onde a ação aconteceu):
 *
 * Conversão
 * - clique_oferta: botões do teste de 7 dias (abrem o WhatsApp) · texto
 * - clique_whatsapp: outros links do WhatsApp · texto
 *
 * Navegação e leitura
 * - clique_navegacao: links internos (#app, #planos...) · destino, texto
 * - ver_secao: primeira vez que cada seção aparece na tela
 * - tempo_secao: segundos que cada seção ficou na tela, enviado ao sair · segundos
 * - rolagem: 25, 50, 75 e 100% da página · percentual
 * - abrir_faq: pergunta aberta no FAQ · pergunta
 *
 * Painel de demonstração (#app)
 * - abrir_aba_demo: aba escolhida · aba
 * - usar_calculadora: placa consultada · placa, origem (digitada | atalho)
 * - ajustar_custos: campo de custo ou margem alterado (uma vez por campo) · campo
 * - salvar_avaliacao: clique em Salvar avaliação
 * - interacao_demo: qualquer outro botão do painel · aba, acao
 *
 * Para ver os parâmetros nos relatórios, registre cada um como dimensão
 * personalizada no GA4 (Admin > Definições personalizadas).
 */
export function initAnalytics() {
  if (typeof window.gtag !== 'function') return () => {};

  const track = (name, params = {}) => window.gtag('event', name, params);
  const sectionOf = (el) => el.closest('section[id]')?.id || 'cabecalho';
  const text = (el) =>
    (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const demoTab = () =>
    text(document.querySelector('#app [role="tab"][aria-selected="true"]') || {}) || 'nenhuma';

  // ---------- Cliques ----------
  const onClick = (e) => {
    const a = e.target.closest('a[href]');
    if (a) {
      const href = a.getAttribute('href');
      const params = { secao: sectionOf(a), texto: text(a) };
      if (href === CONFIG.ctas.trial.href) track('clique_oferta', params);
      else if (href.includes('wa.me')) track('clique_whatsapp', params);
      else if (href.startsWith('#'))
        track('clique_navegacao', { ...params, destino: href.slice(1) || 'topo' });
      return;
    }

    const btn = e.target.closest('#app button');
    if (!btn) return;
    if (btn.getAttribute('role') === 'tab') return track('abrir_aba_demo', { aba: text(btn) });
    if (btn.closest('.ev-quick'))
      return track('usar_calculadora', { placa: text(btn).split(' ')[0], origem: 'atalho' });
    if (btn.classList.contains('ev-save')) return track('salvar_avaliacao', { aba: demoTab() });
    if (btn.closest('.ev-plate')) return; // o envio do formulário conta a consulta
    track('interacao_demo', { aba: demoTab(), acao: text(btn) || 'botao' });
  };
  document.addEventListener('click', onClick);

  // Consulta de placa digitada (Enter ou botão Consultar).
  const onSubmit = (e) => {
    const form = e.target.closest?.('#app .ev-plate');
    if (!form) return;
    const placa = form.querySelector('input')?.value?.trim() || '';
    track('usar_calculadora', { placa: placa.slice(0, 8), origem: 'digitada' });
  };
  document.addEventListener('submit', onSubmit, true);

  // Campos de custo e margem: uma vez por campo, para não inundar o GA.
  const touched = new Set();
  const onChange = (e) => {
    const field = e.target.closest?.('#app .ev-field');
    if (!field) return;
    const campo = text(field.querySelector('span') || field);
    if (touched.has(campo)) return;
    touched.add(campo);
    track('ajustar_custos', { campo });
  };
  document.addEventListener('change', onChange, true);

  // FAQ: pergunta aberta.
  const onToggle = (e) => {
    const d = e.target;
    if (d.tagName === 'DETAILS' && d.open && d.closest('#duvidas'))
      track('abrir_faq', { pergunta: text(d.querySelector('summary')) });
  };
  document.addEventListener('toggle', onToggle, true);

  // ---------- Rolagem ----------
  const marks = [25, 50, 75, 100];
  const sent = new Set();
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = (window.scrollY / max) * 100;
    marks.forEach((m) => {
      if (pct >= m - 1 && !sent.has(m)) {
        sent.add(m);
        track('rolagem', { percentual: m });
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Seções: primeira visita e tempo na tela ----------
  const seen = new Set();
  const since = new Map(); // seção na tela desde (ms)
  const total = new Map(); // ms acumulados
  const stop = (sid) => {
    if (!since.has(sid)) return;
    total.set(sid, (total.get(sid) || 0) + performance.now() - since.get(sid));
    since.delete(sid);
  };
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        const sid = en.target.id;
        if (!en.isIntersecting) return stop(sid);
        since.set(sid, performance.now());
        if (!seen.has(sid)) {
          seen.add(sid);
          track('ver_secao', { secao: sid });
        }
      }),
    { rootMargin: '-45% 0px -45% 0px' },
  );
  const watch = () => document.querySelectorAll('section[id]').forEach((el) => io.observe(el));
  watch();
  // Seções carregadas depois (Defer) entram no observador quando montam.
  const mo = new MutationObserver(watch);
  mo.observe(document.getElementById('root'), { childList: true, subtree: true });

  // Ao sair ou trocar de aba, envia o tempo acumulado de cada seção.
  const flush = () => {
    [...since.keys()].forEach(stop);
    total.forEach((ms, sid) => {
      const segundos = Math.round(ms / 1000);
      if (segundos >= 1) track('tempo_secao', { secao: sid, segundos, transport_type: 'beacon' });
    });
    total.clear();
  };
  const onVis = () => {
    if (document.visibilityState === 'hidden') flush();
    else document.querySelectorAll('section[id]').forEach((el) => io.unobserve(el) || io.observe(el));
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', flush);

  return () => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('submit', onSubmit, true);
    document.removeEventListener('change', onChange, true);
    document.removeEventListener('toggle', onToggle, true);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', flush);
    io.disconnect();
    mo.disconnect();
  };
}
