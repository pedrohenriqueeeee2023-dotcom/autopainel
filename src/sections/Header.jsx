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
      <a className="btn btn-accent ap-fab" href={ctaHref('trial')} target="_blank" rel="noreferrer">
        Testar 7 dias
      </a>
    </>
  );
}
