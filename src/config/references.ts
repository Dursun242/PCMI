/**
 * Références chantiers d'ID Maîtrise : une entrée par chantier, affichée sur la
 * carte et dans la liste de /references-chantiers.
 *
 * Reprises telles quelles de l'ancienne page public/references-chantiers.html.
 * Photos dans public/references-chantiers/ (JPEG, environ 770 px de large).
 * `lat` / `lon` : position du chantier (Google Maps, clic droit sur le lieu).
 */

export interface Chantier {
  titre: string;
  adresse: string;
  /** Nom de la commune ; « Le Havre (Sanvic) » est rattaché au Havre sur la carte. */
  commune: string;
  lat: number;
  lon: number;
  photo: string;
}

/**
 * Adresses exactes : masquées par défaut. La page est publique et indexée ; une
 * adresse de maison particulière n'y figure qu'avec l'accord de ses occupants.
 * À `false`, seule la commune s'affiche et les positions sont arrondies à
 * environ 100 m (invisible sur ce fond de carte sans rues).
 */
export const AFFICHER_ADRESSES = false;

export const chantiers: Chantier[] = [
  { titre: "Maison contemporaine à toit plat", adresse: "86 rue Jules Guesde", commune: "Le Havre", lat: 49.509802, lon: 0.1184467, photo: "/references-chantiers/chantier-01.jpg" },
  { titre: "Maison individuelle de plain-pied", adresse: "264 D80", commune: "Sandouville", lat: 49.5223239, lon: 0.3614802, photo: "/references-chantiers/chantier-02.jpg" },
  { titre: "Maison individuelle contemporaine", adresse: "27 rue Duquesne", commune: "Sainte-Adresse", lat: 49.5160206, lon: 0.0697779, photo: "/references-chantiers/chantier-03.jpg" },
  { titre: "Construction d'un immeuble de 6 logements", adresse: "66 rue de l'Église", commune: "Le Havre", lat: 49.4851806, lon: 0.1328734, photo: "/references-chantiers/chantier-04.jpg" },
  { titre: "Réhabilitation de 1 200 m² – ancien dispensaire municipal", adresse: "Place Danton", commune: "Le Havre", lat: 49.4945508, lon: 0.1226979, photo: "/references-chantiers/chantier-05.jpg" },
  { titre: "Maison individuelle", adresse: "14 allée de Seine", commune: "Saint-Romain-de-Colbosc", lat: 49.5268236, lon: 0.3562245, photo: "/references-chantiers/chantier-06.jpg" },
  { titre: "Maison individuelle", adresse: "55 chemin des Quatre Fermes", commune: "Octeville-sur-Mer", lat: 49.546354, lon: 0.125074, photo: "/references-chantiers/chantier-07.jpg" },
  { titre: "Construction d'un immeuble de bureaux sur 4 niveaux", adresse: "9 rue de Fontenoy", commune: "Le Havre", lat: 49.4989176, lon: 0.1275928, photo: "/references-chantiers/chantier-08.jpg" },
  { titre: "Maison individuelle de plain-pied", adresse: "21 rue des Brumes", commune: "Cauville-sur-Mer", lat: 49.5928354, lon: 0.127252, photo: "/references-chantiers/chantier-09.jpg" },
  { titre: "Ensemble de maisons individuelles", adresse: "23 route de Dondeneville", commune: "Octeville-sur-Mer", lat: 49.5438087, lon: 0.1227081, photo: "/references-chantiers/chantier-10.jpg" },
  { titre: "Maison individuelle", adresse: "12 rue de l'Alliance", commune: "Le Havre", lat: 49.5103796, lon: 0.1149155, photo: "/references-chantiers/chantier-11.jpg" },
  { titre: "Ensemble de logements individuels", adresse: "61 rue Louis Braille", commune: "Le Havre (Sanvic)", lat: 49.511487, lon: 0.101982, photo: "/references-chantiers/chantier-12.jpg" },
  { titre: "Maison individuelle", adresse: "523 D34", commune: "Mélamare", lat: 49.5413286, lon: 0.4158694, photo: "/references-chantiers/chantier-13.jpg" },
  { titre: "Construction de plain-pied", adresse: "38 rue René de la Boutresse", commune: "Saint-Romain-de-Colbosc", lat: 49.527845, lon: 0.357933, photo: "/references-chantiers/chantier-14.jpg" },
  { titre: "Maison individuelle avec piscine", adresse: "5 rue du Calvaire", commune: "Riville", lat: 49.727047, lon: 0.5647489, photo: "/references-chantiers/chantier-15.jpg" },
  { titre: "Maison individuelle", adresse: "3 rue du Vent d'Ouest", commune: "Cauville-sur-Mer", lat: 49.5911462, lon: 0.1265937, photo: "/references-chantiers/chantier-16.jpg" },
  { titre: "Maison de ville", adresse: "58 avenue de l'Hippodrome", commune: "Sainte-Adresse", lat: 49.5068386, lon: 0.0769051, photo: "/references-chantiers/chantier-17.jpg" },
  { titre: "Maison individuelle", adresse: "14 rue Darwin", commune: "Le Havre", lat: 49.5113633, lon: 0.1247457, photo: "/references-chantiers/chantier-18.jpg" },
  { titre: "Construction d'un immeuble de 8 logements", adresse: "58 rue Gustave Flaubert", commune: "Le Havre", lat: 49.4981126, lon: 0.1134597, photo: "/references-chantiers/chantier-19.jpg" },
  { titre: "Maison individuelle", adresse: "8 impasse du Clos aux Pommiers", commune: "Fontaine-la-Mallet", lat: 49.5377036, lon: 0.148095, photo: "/references-chantiers/chantier-20.jpg" },
  { titre: "Maison individuelle", adresse: "37 rue Marconi", commune: "Le Havre", lat: 49.5213248, lon: 0.121757, photo: "/references-chantiers/chantier-21.jpg" },
  { titre: "Construction d'une mosquée", adresse: "55 rue Maurice Genevoix", commune: "Le Havre", lat: 49.5151431, lon: 0.1012433, photo: "/references-chantiers/chantier-22.jpg" },
  { titre: "Maison contemporaine avec piscine", adresse: "8 rue du Courtil", commune: "Saint-Romain-de-Colbosc", lat: 49.5258449, lon: 0.3550708, photo: "/references-chantiers/chantier-23.jpg" },
  { titre: "Maison individuelle", adresse: "302 rue Louis Lumière", commune: "Le Havre", lat: 49.5267224, lon: 0.1257537, photo: "/references-chantiers/chantier-24.jpg" },
  { titre: "Maison individuelle 130 m²", adresse: "41 rue Granados", commune: "Le Havre (Bléville)", lat: 49.5232875, lon: 0.1252752, photo: "/references-chantiers/chantier-25.jpg" },
  { titre: "Maison individuelle", adresse: "23 rue Simone Veil", commune: "Rogerville", lat: 49.5049713, lon: 0.2639229, photo: "/references-chantiers/chantier-26.jpg" },
  { titre: "Maison de plain-pied avec double garage", adresse: "2 chemin de Campemeille", commune: "Rogerville", lat: 49.5105225, lon: 0.2837162, photo: "/references-chantiers/chantier-27.jpg" },
  { titre: "Maisons de ville contemporaines", adresse: "58 rue Roger Salengro", commune: "Le Havre", lat: 49.5073862, lon: 0.1117454, photo: "/references-chantiers/chantier-28.jpg" },
  { titre: "Maison individuelle", adresse: "24 rue Henri Domergue", commune: "Le Havre", lat: 49.5143121, lon: 0.1258694, photo: "/references-chantiers/chantier-29.jpg" },
  { titre: "Maison contemporaine à toit plat", adresse: "Rue des Brumes (fond de l'allée du n° 23)", commune: "Cauville-sur-Mer", lat: 49.5926027, lon: 0.1279656, photo: "/references-chantiers/chantier-30.jpg" },
];

/**
 * Les plus belles références, dans l'ordre du carrousel de l'accueil
 * (components/ReferencesSlider.tsx). Une photo de la liste ci-dessus par ligne ;
 * changer l'ordre ou en retirer suffit.
 */
export const vitrine: string[] = [
  "/references-chantiers/chantier-23.jpg", // maison contemporaine avec piscine
  "/references-chantiers/chantier-15.jpg", // maison avec piscine
  "/references-chantiers/chantier-13.jpg",
  "/references-chantiers/chantier-29.jpg",
  "/references-chantiers/chantier-03.jpg", // maison contemporaine, Sainte-Adresse
  "/references-chantiers/chantier-27.jpg", // plain-pied avec double garage, vu du ciel
  "/references-chantiers/chantier-24.jpg",
  "/references-chantiers/chantier-26.jpg",
  "/references-chantiers/chantier-01.jpg", // maison contemporaine à toit plat
];
