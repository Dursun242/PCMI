import localFont from "next/font/local";

/*
 * Polices auto-hébergées via next/font (fichiers latin de @fontsource),
 * doublées d'une police de repli aux mêmes métriques, pour que le texte ne
 * « saute » pas quand la vraie police arrive (décalage de mise en page mesuré
 * à 0,13 sur téléphone avec les @import CSS).
 *
 * Seules les polices des titres sont préchargées : précharger les six fichiers
 * (140 Ko) retardait le premier affichage d'environ 0,3 s en 4G lente, car ils
 * passaient avant la feuille de style. Mesures du 31/10/2026 (Chrome, CPU ÷4,
 * 1,6 Mbit/s) : premier affichage 1,22 s → 0,94 s sur /permis-express,
 * 1,22 s → 1,03 s sur l'accueil, sans aucun décalage de mise en page.
 */
export const lato = localFont({
  src: [
    { path: "../../node_modules/@fontsource/lato/files/lato-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/lato/files/lato-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/lato/files/lato-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lato",
  // Texte courant : la police de repli (plus large) ajoute parfois une ligne aux
  // paragraphes du haut de page, et la page « saute » à l'arrivée de Lato. Avec
  // « optional », Lato préchargée s'affiche d'emblée ; si elle arrive trop tard,
  // la page garde la police système jusqu'à la suivante, sans décalage.
  display: "optional",
  // Pas de préchargement : avec « optional », une police en retard n'est
  // simplement pas utilisée sur cette page, sans décalage ; elle l'est à la suivante.
  preload: false,
  adjustFontFallback: "Arial",
});

export const cormorant = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  // Titres (souvent l'élément principal de la page pour Google) : préchargés,
  // sinon le changement de police les ferait bouger.
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

/** Cormorant 600, pour le seul tampon « Accordé » (formulaires, confirmations) : chargée à la demande. */
export const cormorantTampon = localFont({
  src: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2",
  weight: "600",
  variable: "--font-tampon",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
