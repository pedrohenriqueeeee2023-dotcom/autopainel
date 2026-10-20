import './PhotoBand.css';

/* Fotos gratuitas do Unsplash (licença Unsplash), em duas fileiras que rolam
   sem parar em sentidos opostos. */
const ROWS = [
  [
    '1574023240744-64c47c8c0676',
    '1621808752171-531c30903889',
    '1574023278969-abb7ab49945c',
    '1585390062628-be8608aa7d83',
    '1564631211140-d918ad9b66d4',
    '1656685299734-52a0bb4425aa',
  ],
  [
    '1671719367451-7bf05ae9549c',
    '1600191762849-bf8fd13e9dc0',
    '1570761511122-dd6342842496',
    '1589261419091-7e9610a479f8',
    '1565043666747-69f6646db940',
    '1615563868638-98253a7dc33b',
  ],
];
const src = (id) => `https://images.unsplash.com/photo-${id}?w=640&h=420&fit=crop&auto=format&q=60`;

/** Faixa com fotos rolando ao fundo. O conteúdo fica por cima, sobre um véu escuro. */
export default function PhotoBand({ children, className = '' }) {
  return (
    <div className={`band-photo ${className}`}>
      <div className="band-reel" aria-hidden="true">
        {ROWS.map((row, r) => (
          <div key={r} className={`band-row ${r ? 'is-rev' : ''}`}>
            {/* A fileira repete uma vez para a volta ficar sem emenda. */}
            {[...row, ...row].map((id, i) => (
              <img key={i} src={src(id)} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        ))}
      </div>
      <div className="band-in">{children}</div>
    </div>
  );
}
