import { CONFIG } from '../config';

export default function Footer() {
  return (
    <footer className="ap-footer">
      <span className="ap-logo">
        <span className="ap-logo-mark" aria-hidden="true" />
        {CONFIG.brand.name}
      </span>
      <span>{CONFIG.brand.tagline}</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
