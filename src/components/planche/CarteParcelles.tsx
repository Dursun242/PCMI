"use client";

import { useState } from "react";
import { cadrer, centre, cheminSvg, urlFondOrtho, type ParcelleCandidate } from "@/lib/planche";

interface Props {
  parcelles: ParcelleCandidate[];
  choisie: string;
  onChoisir: (idu: string) => void;
}

/**
 * Cadre centré sur la parcelle la plus proche de l'adresse, avec assez de marge
 * pour voir et toucher ses voisines. Calculé une fois par recherche : la carte
 * ne saute pas quand le visiteur choisit une autre parcelle, et une grande
 * parcelle voisine (un parc, une voirie) ne réduit pas le terrain à un timbre.
 */
function cadreInitial(parcelles: ParcelleCandidate[]) {
  const proche = parcelles[0];
  if (!proche) return null;
  const c = cadrer([proche], 0);
  if (!c) return null;
  return cadrer([proche], Math.max(22, 0.45 * Math.max(c.largeur, c.hauteur)));
}

/**
 * Parcelles autour de l'adresse, sur l'orthophoto IGN : le visiteur touche la
 * sienne. Coordonnées en mètres (projection locale), superposées exactement à
 * l'image WMS demandée sur le même cadre.
 */
export default function CarteParcelles({ parcelles, choisie, onChoisir }: Props) {
  const [fondKo, setFondKo] = useState(false);
  const cadre = cadreInitial(parcelles);
  if (!cadre) return null;
  const { largeur: w, hauteur: h } = cadre;
  const corps = Math.max(2.2, Math.min(w, h) / 26);
  const ordre = [...parcelles].sort((a, b) => Number(a.idu === choisie) - Number(b.idu === choisie));

  return (
    <div className="relative overflow-hidden border border-ink bg-forest">
      <svg viewBox={`0 0 ${w.toFixed(2)} ${h.toFixed(2)}`} className="block h-auto w-full" role="group" aria-label="Parcelles autour de l'adresse : touchez la vôtre">
        {!fondKo && (
          <image href={urlFondOrtho(cadre)} x="0" y="0" width={w} height={h} preserveAspectRatio="none" onError={() => setFondKo(true)} />
        )}
        {ordre.map((p) => {
          const actif = p.idu === choisie;
          const [cx, cy] = centre(cadre, p.contours);
          return (
            <g key={p.idu}>
              <path
                d={cheminSvg(cadre, p.contours)}
                role="button"
                tabIndex={0}
                aria-pressed={actif}
                aria-label={`Parcelle ${p.section} ${p.numero}, ${p.contenance} m²`}
                onClick={() => onChoisir(p.idu)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChoisir(p.idu);
                  }
                }}
                className={`cursor-pointer outline-none transition-[fill] duration-200 ${
                  actif ? "fill-[#d9c69d]/45" : "fill-white/5 hover:fill-white/25 focus-visible:fill-white/30"
                }`}
                stroke={actif ? "#d9c69d" : "#ffffff"}
                strokeWidth={actif ? 3 : 1.2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={corps}
                fontWeight={actif ? 700 : 400}
                fill="#ffffff"
                stroke="#1b1f1d"
                strokeWidth={corps / 6}
                paintOrder="stroke"
                className="pointer-events-none select-none"
              >
                {p.numero.replace(/^0+/, "")}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="pointer-events-none absolute bottom-1.5 right-2 text-[0.65rem] text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">
        © IGN · cadastre DGFiP
      </p>
    </div>
  );
}
