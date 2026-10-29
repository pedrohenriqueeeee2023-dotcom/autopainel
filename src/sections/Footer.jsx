import { CONFIG } from '../config';
import { openConsent } from '../consent';
import './Footer.css';

/** Cadeado do selo de site seguro. */
export function Lock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export default function Footer() {
  const c = CONFIG.company;
  const year = new Date().getFullYear();
  return (
    <footer className="ft">
      <div className="ft-in">
        <div className="ft-brand">
          <p className="ft-logo">
            <span className="ap-logo-mark" aria-hidden="true" />
            {CONFIG.brand.name}
          </p>
          <p className="ft-muted">{CONFIG.brand.tagline}</p>
          <p className="ft-secure">
            <Lock /> Site seguro · conexão criptografada (HTTPS)
          </p>
        </div>

        <address className="ft-company">
          {c.legalName && <span>{c.legalName}</span>}
          {c.cnpj && <span>CNPJ {c.cnpj}</span>}
          {c.address && <span>{c.address}</span>}
          {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
          {c.phone && <span>WhatsApp {c.phone}</span>}
        </address>

        <nav className="ft-links" aria-label="Privacidade">
          <a href="/privacidade">Política de Privacidade</a>
          <a href="/privacidade#cookies">Política de Cookies</a>
          <button type="button" onClick={openConsent}>
            Preferências de cookies
          </button>
        </nav>
      </div>
      <p className="ft-copy">
        © {year} {c.legalName || CONFIG.brand.name}. Tratamos seus dados conforme a LGPD (Lei 13.709/2018).
      </p>
    </footer>
  );
}
