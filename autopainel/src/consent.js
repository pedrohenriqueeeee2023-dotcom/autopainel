/**
 * Consentimento de cookies (LGPD). A escolha fica no navegador em `ap-cookies`:
 * 'all' (aceitou medição e anúncios) ou 'essential' (só o necessário).
 * O index.html já lê essa escolha antes de carregar o Google Analytics e o Pixel.
 */
const KEY = 'ap-cookies';

export function getConsent() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* navegador sem armazenamento: a escolha vale só nesta visita */
  }
  const state = value === 'all' ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
  window.fbq?.('consent', value === 'all' ? 'grant' : 'revoke');
  window.dispatchEvent(new Event('ap-consent'));
}

/** Reabre o aviso de cookies (link "Preferências de cookies" no rodapé). */
export function openConsent() {
  window.dispatchEvent(new Event('ap-consent-open'));
}
