import { CONFIG, ctaHref } from '../config';

export default function Header() {
  return (
    <>
      <header className="ap-header">
        <a className="ap-logo" href="#topo" aria-label={`${CONFIG.brand.name} — início`}>
          <span className="ap-logo-mark" aria-hidden="true" />
          {CONFIG.brand.name}
        </a>
        <span className="ap-progress" aria-hidden="true" />
      </header>
      <div className="ap-fab">
        <a
          className="btn btn-wa ap-fab-wa"
          href={ctaHref('contact')}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar no WhatsApp"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
            <path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.3-1.6-2.8-2.8l.9-1-1-2z" />
          </svg>
        </a>
        <a className="btn btn-accent" href={ctaHref('trial')} target="_blank" rel="noreferrer">
          Testar 7 dias
        </a>
      </div>
    </>
  );
}
