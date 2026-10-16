/** Silhueta de veículo em SVG (sem fotos de banco de imagem). */
export default function CarGlyph({ tone = 0, className = '' }) {
  const fills = ['#2a3446', '#3b2f2a', '#26363a', '#34303f'];
  return (
    <svg className={`car-glyph ${className}`} viewBox="0 0 160 90" aria-hidden="true">
      <rect width="160" height="90" fill={fills[tone % fills.length]} />
      <rect y="64" width="160" height="26" fill="rgba(0,0,0,.25)" />
      <path
        d="M14 62c0-7 4-11 11-12l19-3 17-13c4-3 8-4 13-4h31c6 0 10 2 14 6l11 11 13 2c7 1 11 5 11 11v4H14z"
        fill="#c9d1dc"
        opacity=".9"
      />
      <path d="M66 36h16v12H52zM87 36h19c3 0 5 1 7 3l8 9H87z" fill="#1a2230" />
      <circle cx="45" cy="66" r="10" fill="#0c1016" />
      <circle cx="45" cy="66" r="4.5" fill="#7d8796" />
      <circle cx="119" cy="66" r="10" fill="#0c1016" />
      <circle cx="119" cy="66" r="4.5" fill="#7d8796" />
    </svg>
  );
}
