import { useEffect, useState } from 'react';
import { getConsent, setConsent } from './consent';
import './CookieBanner.css';

/* Aviso de cookies: aparece até o visitante escolher, e de novo pelo rodapé. */
export default function CookieBanner() {
  const [open, setOpen] = useState(() => !getConsent());

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('ap-consent-open', reopen);
    return () => window.removeEventListener('ap-consent-open', reopen);
  }, []);

  if (!open) return null;
  const choose = (v) => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div className="ck" role="dialog" aria-live="polite" aria-labelledby="ck-title">
      <p id="ck-title" className="ck-title">
        🍪 Cookies e privacidade
      </p>
      <p className="ck-text">
        Usamos cookies necessários para o site funcionar e, com a sua permissão, cookies de medição (Google
        Analytics) e de anúncios (Meta) para melhorar a página. Saiba mais na{' '}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>
      <div className="ck-btns">
        <button type="button" className="btn ck-btn" onClick={() => choose('essential')}>
          Só necessários
        </button>
        <button type="button" className="btn btn-accent ck-btn" onClick={() => choose('all')}>
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
