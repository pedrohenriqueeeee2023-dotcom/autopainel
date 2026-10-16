import { CONFIG, ctaHref } from '../config';

export default function Header() {
  return (
    <header className="ap-header">
      <a className="ap-logo" href="#topo" aria-label={`${CONFIG.brand.name} — início`}>
        <span className="ap-logo-mark" aria-hidden="true" />
        {CONFIG.brand.name}
      </a>
      <nav className="ap-nav" aria-label="Navegação principal">
        <a href="#publicacao">Publicação</a>
        <a href="#crm">CRM</a>
        <a href="#calculadora">Calculadora</a>
        <a href="#planos">Planos</a>
      </nav>
      <a className="btn btn-sm btn-accent" href={ctaHref('trial')}>
        Testar grátis
      </a>
      <span className="ap-progress" aria-hidden="true" />
    </header>
  );
}
