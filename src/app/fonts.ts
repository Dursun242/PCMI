import localFont from "next/font/local";

/*
 * Polices auto-hébergées via next/font (fichiers latin de @fontsource) :
 * préchargées dans le <head> et doublées d'une police de repli aux mêmes
 * métriques, pour que le texte ne « saute » pas quand la vraie police arrive
 * (décalage de mise en page mesuré à 0,13 sur téléphone avec les @import CSS).
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
  adjustFontFallback: "Arial",
});

export const cormorant = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
