/**
 * Façade d'une maison contemporaine dessinée façon planche PCMI 5,
 * au trait fin, pour fond sombre. Cotes, niveaux, hachures de sol.
 */
export default function HouseDrawing({
  className = "",
  line = "#d9c69d",
  soft = "rgba(217,198,157,0.45)",
  fill = "rgba(252,251,249,0.04)",
}: {
  className?: string;
  line?: string;
  soft?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 720 420" className={className} role="img" aria-labelledby="house-title" fill="none">
      <title id="house-title">Façade sud d&apos;une maison contemporaine à toit plat et volume en bardage, dessinée à l&apos;échelle avec ses cotes</title>

      {/* sol et hachures */}
      <line x1="30" y1="340" x2="690" y2="340" stroke={line} strokeWidth="1.4" />
      <g stroke={soft} strokeWidth="0.8">
        {Array.from({ length: 33 }).map((_, i) => (
          <line key={i} x1={30 + i * 20} y1="340" x2={18 + i * 20} y2="354" />
        ))}
      </g>

      {/* volume haut : R+1 toit plat, enduit */}
      <rect x="150" y="120" width="300" height="220" stroke={line} strokeWidth="1.4" fill={fill} />
      <line x1="140" y1="120" x2="460" y2="120" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
      {/* casquette entre les niveaux */}
      <line x1="140" y1="228" x2="460" y2="228" stroke={line} strokeWidth="1.8" strokeLinecap="round" />

      {/* volume bas : garage / séjour en bardage bois */}
      <rect x="450" y="212" width="210" height="128" stroke={line} strokeWidth="1.4" fill={fill} />
      <line x1="442" y1="212" x2="668" y2="212" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
      <g stroke={soft} strokeWidth="0.8">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1="452" y1={224 + i * 11.5} x2="658" y2={224 + i * 11.5} />
        ))}
      </g>

      {/* baie vitrée toute hauteur RDC */}
      <rect x="172" y="240" width="170" height="100" stroke={line} strokeWidth="1.2" />
      <line x1="257" y1="240" x2="257" y2="340" stroke={line} strokeWidth="0.9" />
      <path d="M180 248l36 30M188 248l36 30" stroke={soft} strokeWidth="0.8" />
      <path d="M266 248l36 30M274 248l36 30" stroke={soft} strokeWidth="0.8" />

      {/* porte d'entrée pleine, laiton */}
      <rect x="372" y="256" width="52" height="84" stroke={line} strokeWidth="1.2" fill="rgba(169,136,79,0.35)" />
      <line x1="414" y1="298" x2="414" y2="310" stroke={line} strokeWidth="1.6" strokeLinecap="round" />

      {/* fenêtres R+1 en bandeau */}
      <rect x="172" y="146" width="96" height="60" stroke={line} strokeWidth="1.2" />
      <line x1="220" y1="146" x2="220" y2="206" stroke={line} strokeWidth="0.9" />
      <rect x="292" y="146" width="132" height="60" stroke={line} strokeWidth="1.2" />
      <line x1="336" y1="146" x2="336" y2="206" stroke={line} strokeWidth="0.9" />
      <line x1="380" y1="146" x2="380" y2="206" stroke={line} strokeWidth="0.9" />

      {/* baie du volume bas */}
      <rect x="480" y="232" width="150" height="108" stroke={line} strokeWidth="1.2" />
      <line x1="555" y1="232" x2="555" y2="340" stroke={line} strokeWidth="0.9" />

      {/* arbre au trait */}
      <g stroke={soft} strokeWidth="1">
        <line x1="90" y1="340" x2="90" y2="250" />
        <path d="M90 250c-30 0-46-24-40-48 6-22 30-30 40-30s34 8 40 30c6 24-10 48-40 48Z" />
        <path d="M90 300l-14-18M90 280l12-16" />
      </g>

      {/* cotes horizontales */}
      <g stroke={line} strokeWidth="0.9">
        <line x1="150" y1="378" x2="450" y2="378" />
        <line x1="450" y1="378" x2="660" y2="378" />
        <line x1="150" y1="370" x2="150" y2="386" />
        <line x1="450" y1="370" x2="450" y2="386" />
        <line x1="660" y1="370" x2="660" y2="386" />
        <path d="M150 378l7-3.5M150 378l7 3.5M450 378l-7-3.5M450 378l-7 3.5M450 378l7-3.5M450 378l7 3.5M660 378l-7-3.5M660 378l-7 3.5" />
      </g>
      <g fontFamily="Lato, sans-serif" fontSize="12" fill={line} textAnchor="middle">
        <text x="300" y="400">12,00</text>
        <text x="555" y="400">8,40</text>
      </g>

      {/* cotes verticales et niveaux */}
      <g stroke={line} strokeWidth="0.9">
        <line x1="120" y1="340" x2="120" y2="120" />
        <line x1="112" y1="340" x2="128" y2="340" />
        <line x1="112" y1="228" x2="128" y2="228" />
        <line x1="112" y1="120" x2="128" y2="120" />
      </g>
      <g fontFamily="Lato, sans-serif" fontSize="11" fill={line} textAnchor="end">
        <text x="106" y="344">±0,00</text>
        <text x="106" y="232">+3,20</text>
        <text x="106" y="124">+6,40</text>
      </g>

      {/* cartouche de vue */}
      <g fontFamily="Lato, sans-serif" fill={line}>
        <text x="30" y="40" fontSize="11" fontWeight="700" letterSpacing="2.4">PCMI 5</text>
        <text x="30" y="58" fontSize="12" opacity="0.8">Façade sud — 1/100</text>
      </g>
      <g transform="translate(672 44)" stroke={line} strokeWidth="1">
        <circle r="15" />
        <path d="M0 -11v22M0 -11l-4.5 7.5h9Z" fill={line} />
      </g>
    </svg>
  );
}
