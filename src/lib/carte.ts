/**
 * Carte des références chantiers : projection, communes concernées et cadrage.
 * Fonctions pures, sans DOM, partagées par la page et le composant de carte.
 *
 * Le fond de carte (src/config/carte-le-havre.json) vient de l'ancienne page
 * public/references-chantiers.html : limites communales IGN / Etalab (licence
 * ouverte), projetées sur un repère de W × H unités.
 */

import type { Chantier } from "@/config/references";

export interface FondDeCarte {
  W: number;
  H: number;
  /** [lon min, lon max, lat min, lat max] du cadre. */
  box: [number, number, number, number];
  /** Correction de longitude (cos de la latitude moyenne). */
  k: number;
  /** Unités de carte par degré de latitude. */
  sx: number;
  /** [nom de la commune, tracé SVG]. */
  paths: [string, string][];
  /** [nom, x, y] des villes repères. */
  labels: [string, number, number][];
}

/** Un chantier tel qu'il est publié sur la page : sans adresse si elles sont masquées. */
export interface PointPublic {
  titre: string;
  /** Commune seule, ou « adresse — commune ». */
  lieu: string;
  lat: number;
  lon: number;
  photo: string;
  x: number;
  y: number;
}

export interface Vue {
  x: number;
  y: number;
  w: number;
}

/** 1 degré de latitude ≈ 111,32 km. */
export const KM_PAR_DEGRE = 111.32;

export function projeter(carte: FondDeCarte, lon: number, lat: number): [number, number] {
  return [(lon - carte.box[0]) * carte.k * carte.sx, (carte.box[3] - lat) * carte.sx];
}

/** « Le Havre (Sanvic) » → « Le Havre » : le quartier est rattaché à sa commune. */
export function communeDeCarte(commune: string): string {
  return commune.replace(/\s*\(.*\)\s*$/, "");
}

export function communesAvecChantier(liste: Chantier[]): Set<string> {
  return new Set(liste.map((c) => communeDeCarte(c.commune)));
}

/** Teinte d'une commune : en avant si elle a un chantier, Le Havre à part, sinon quatre teintes alternées. */
export function classeCommune(nom: string, index: number, avecChantier: Set<string>): string {
  if (avecChantier.has(nom)) return "hi";
  if (nom === "Le Havre") return "ville";
  return `t${(index * 7) % 4}`;
}

const arrondi = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Ce qui part dans la page. Adresses masquées : commune seule et position
 * arrondie à environ 100 m, ce qui ne se voit pas sur un fond sans rues.
 */
export function pointsPublics(carte: FondDeCarte, liste: Chantier[], afficherAdresses: boolean): PointPublic[] {
  return liste.map((c) => {
    const lat = afficherAdresses ? c.lat : arrondi(c.lat);
    const lon = afficherAdresses ? c.lon : arrondi(c.lon);
    const [x, y] = projeter(carte, lon, lat);
    return {
      titre: c.titre,
      lieu: afficherAdresses ? `${c.adresse} — ${c.commune}` : c.commune,
      lat,
      lon,
      photo: c.photo,
      x,
      y,
    };
  });
}

/** Largeur minimale de la vue d'ensemble : toute l'agglomération reste visible. */
const LARGEUR_MIN = 300;
const MARGE = 1.4;
/** Position verticale du centre : un peu plus bas que le milieu, pour laisser la place aux fiches. */
const DECALAGE_VERTICAL = 0.62;

/** Vue qui cadre tous les chantiers, pour un rapport largeur / hauteur donné. */
export function vueEnsemble(points: Pick<PointPublic, "x" | "y">[], aspect: number): Vue {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const h = Math.max(y1 - y0, LARGEUR_MIN / aspect) * MARGE;
  const w = Math.max(Math.max(x1 - x0, LARGEUR_MIN) * MARGE, h * aspect);
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - (w / aspect) * DECALAGE_VERTICAL, w };
}
