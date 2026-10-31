import type { ReactNode } from "react";

/** Pictogramme de chaque pièce, dessiné dans une feuille de 24 × 30. */
const PIECES: [code: string, nom: string, dessin: ReactNode][] = [
  [
    "CERFA",
    "Formulaire CERFA 13406",
    <>
      <rect x="5" y="5" width="14" height="3" />
      <path d="M5 12h3v3H5zM5 18h3v3H5z" />
      <path d="M10 13.5h9M10 19.5h9M5 25h14" />
    </>,
  ],
  [
    "PCMI 1",
    "Plan de situation",
    <>
      <path d="M3 18 21 9M8 4l5 23" />
      <circle cx="13" cy="15" r="2.2" />
    </>,
  ],
  [
    "PCMI 2",
    "Plan de masse",
    <>
      <path d="M4 7h16v19H4z" strokeDasharray="2 1.5" />
      <rect x="8" y="12" width="8" height="7" />
      <path d="M12 3v3M10.5 4.5 12 3l1.5 1.5" />
    </>,
  ],
  [
    "PCMI 3",
    "Plan en coupe",
    <>
      <path d="M2 23c6-2 14-2 20-4" />
      <path d="M7 22V14l5-5 5 5v7" />
    </>,
  ],
  [
    "PCMI 4",
    "Notice descriptive",
    <>
      <path d="M5 7h14M5 11h14M5 15h14M5 19h10M5 23h12" />
    </>,
  ],
  [
    "PCMI 5",
    "Plans des façades et des toitures",
    <>
      <path d="M5 24V14l7-6 7 6v10z" />
      <path d="M10 24v-5h4v5M3 24h18" />
    </>,
  ],
  [
    "PCMI 6",
    "Insertion dans le paysage",
    <>
      <path d="M4 24v-7l5-4 5 4v7z" />
      <circle cx="18" cy="15" r="3" />
      <path d="M18 18v6M2 24h20" />
    </>,
  ],
  [
    "PCMI 7",
    "Photo de l'environnement proche",
    <>
      <rect x="3" y="8" width="18" height="14" rx="1" />
      <path d="M7 20v-5l5-4 5 4v5" />
    </>,
  ],
  [
    "PCMI 8",
    "Photo de l'environnement lointain",
    <>
      <rect x="3" y="8" width="18" height="14" rx="1" />
      <path d="M3 18l6-4 5 3 4-3 3 2M10 19v-2l1.5-1.2L13 17v2" />
    </>,
  ],
];

/**
 * /permis-express, sous le prix : ce que contient le dossier, en neuf feuilles
 * miniatures (le CERFA puis les pièces PCMI 1 à 8), nommées au survol et pour
 * les lecteurs d'écran. Elles arrivent en cascade (data-stagger, app/motion.css).
 */
export default function ExpressPiecesDossier() {
  return (
    <div className="mt-4">
      <p className="text-sm text-paper/85">
        <strong className="text-paper">Dossier complet, prêt à déposer</strong> : formulaire CERFA 13406 et les 8 pièces PCMI.
      </p>
      <ul data-stagger className="mt-3 flex gap-1.5 sm:gap-2" aria-label="Pièces du dossier de permis de construire">
        {PIECES.map(([code, nom, dessin]) => (
          <li key={code} title={`${code} · ${nom}`} className="flex w-[2.15rem] flex-col items-center gap-1 sm:w-10">
            <svg
              viewBox="0 0 24 30"
              className="w-full rounded-[2px] bg-paper text-ink shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Coin replié de la feuille. */}
              <path d="M19 0h5v5z" fill="var(--color-brass-2)" stroke="none" />
              {dessin}
            </svg>
            <span className="text-[0.55rem] font-bold leading-none tracking-[0.04em] text-brass-2 sm:text-[0.6rem]">
              {code.replace("PCMI ", "")}
            </span>
            <span className="sr-only">{nom}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
