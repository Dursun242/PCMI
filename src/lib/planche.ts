/**
 * Planche gratuite de l'état existant : une seule planche par parcelle
 * (plan de situation, plan de masse de l'existant ou coupes du terrain),
 * envoyée par e-mail contre le nom et l'adresse e-mail du visiteur.
 *
 * Ce module ne contient que du code pur (types, validation, géométrie
 * d'affichage) : il sert au formulaire comme à l'API, et il est testé.
 * La planche elle-même est dessinée par l'outil PCMI d'ID Maîtrise
 * (dépôt id-plans, workflow « Planche gratuite »).
 */

export type Planche = "situation" | "masse" | "coupes";

export interface InfoPlanche {
  titre: string;
  /** Ce que la planche montre, en une phrase. */
  contenu: string;
  /** Page du site dédiée à cette planche. */
  path: string;
}

export const PLANCHES: Record<Planche, InfoPlanche> = {
  masse: {
    titre: "Plan de masse de l'existant",
    contenu: "Le terrain coté, sa surface, les bâtiments existants, la voie, les voisins et les altitudes du terrain naturel.",
    path: "/plan-de-masse-gratuit",
  },
  coupes: {
    titre: "Coupes du terrain",
    contenu: "Le profil du terrain naturel dans ses deux sens, en long et en travers, avec les altitudes et la pente.",
    path: "/coupe-de-terrain-gratuite",
  },
  situation: {
    titre: "Plan de situation",
    contenu: "Le terrain repéré dans la commune, dans le quartier et sur l'extrait cadastral, avec le nord et les échelles.",
    path: "/plan-de-situation-gratuit",
  },
};

export const ORDRE_PLANCHES: Planche[] = ["masse", "coupes", "situation"];

export const estPlanche = (v: unknown): v is Planche => typeof v === "string" && v in PLANCHES;

/** IDU cadastral : code INSEE (5), préfixe de section (3), section (2), numéro (4). */
const IDU = /^(?:\d{2}|2A|2B)\d{3}\d{3}[A-Z0-9]{2}\d{4}$/;
export const estIdu = (v: string) => IDU.test(v);

/** « 76351000OJ0646 » → « OJ 0646 ». */
export function referenceCourte(idu: string): string {
  return estIdu(idu) ? `${idu.slice(8, 10).replace(/^0/, "")} ${idu.slice(10)}` : idu;
}

/** Une parcelle candidate, telle que l'API la renvoie au formulaire. */
export interface ParcelleCandidate {
  idu: string;
  section: string;
  numero: string;
  commune: string;
  codeInsee: string;
  /** Contenance cadastrale, en m². */
  contenance: number;
  /** Anneaux extérieurs, en [longitude, latitude]. */
  contours: [number, number][][];
  /** Distance du point de l'adresse à la parcelle, en mètres (0 : l'adresse tombe dedans). */
  distance: number;
}

export interface RechercheTerrain {
  adresse: { label: string; voie: string; ville: string; lon: number; lat: number };
  parcelles: ParcelleCandidate[];
}

/* ---------- Saisie du visiteur ---------- */

export interface DemandePlanche {
  planche: Planche;
  idu: string;
  /** Numéro et voie, pour le cartouche. */
  voie: string;
  /** « 76620 Le Havre ». */
  ville: string;
  commune: string;
  prenom: string;
  nom: string;
  email: string;
}

export type ErreursDemande = Partial<Record<keyof DemandePlanche | "consentement", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Lettres, espaces, apostrophes, tirets et points : ce que l'outil accepte dans un cartouche. */
const NOM_PROPRE = /^[\p{L}][\p{L}\s'’.\-]*$/u;
const TEXTE_ADRESSE = /^[\p{L}\p{N}\s'’\-.,/°()&_]+$/u;

const propre = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * Valide le corps de la requête du formulaire. Renvoie la demande nettoyée, ou
 * les erreurs champ par champ. Le pot de miel est traité par l'API, avant.
 */
export function validerDemande(corps: Record<string, unknown>): { demande: DemandePlanche } | { erreurs: ErreursDemande } {
  const d: DemandePlanche = {
    planche: (estPlanche(corps.planche) ? corps.planche : "masse") as Planche,
    idu: propre(corps.idu, 14).toUpperCase(),
    voie: propre(corps.voie, 120),
    ville: propre(corps.ville, 80),
    commune: propre(corps.commune, 80),
    prenom: capitaliserPrenom(propre(corps.prenom, 40)),
    nom: propre(corps.nom, 40),
    email: propre(corps.email, 200).toLowerCase(),
  };
  const e: ErreursDemande = {};
  if (!estPlanche(corps.planche)) e.planche = "Choisissez une planche.";
  if (!estIdu(d.idu)) e.idu = "Confirmez votre parcelle sur la carte.";
  if (!d.voie || !TEXTE_ADRESSE.test(d.voie)) e.voie = "Adresse du terrain invalide.";
  if (!d.ville || !TEXTE_ADRESSE.test(d.ville)) e.ville = "Commune du terrain invalide.";
  if (!d.prenom || !NOM_PROPRE.test(d.prenom)) e.prenom = "Indiquez votre prénom.";
  if (!d.nom || !NOM_PROPRE.test(d.nom)) e.nom = "Indiquez votre nom.";
  if (!EMAIL.test(d.email)) e.email = "Adresse e-mail invalide : c'est là que nous envoyons le plan.";
  if (corps.consentement !== true) e.consentement = "Merci d'accepter que nous utilisions ces informations.";
  return Object.keys(e).length ? { erreurs: e } : { demande: d };
}

/** « jean-marie » → « Jean-Marie ». */
export function capitaliserPrenom(prenom: string): string {
  return prenom.toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());
}

/** Nom porté dans le cartouche : « Jean DURAND ». */
export function nomCartouche(d: Pick<DemandePlanche, "prenom" | "nom">): string {
  return `${capitaliserPrenom(d.prenom)} ${d.nom.toUpperCase()}`;
}

/* ---------- Géométrie d'affichage (formulaire) ---------- */

const RAYON_TERRE = 6_371_000;
const RAD = Math.PI / 180;

export interface Cadre {
  /** Emprise en degrés : ouest, sud, est, nord. */
  ouest: number;
  sud: number;
  est: number;
  nord: number;
  /** Dimensions de la vue, en mètres. */
  largeur: number;
  hauteur: number;
}

/**
 * Cadre englobant les parcelles avec une marge, dans une projection locale
 * équirectangulaire : aux échelles d'un terrain, l'écart avec le Lambert 93
 * est invisible, et elle se superpose exactement à une image WMS en EPSG:4326
 * dont le rapport largeur/hauteur respecte cos(latitude).
 */
export function cadrer(parcelles: ParcelleCandidate[], margeM = 15): Cadre | null {
  const points = parcelles.flatMap((p) => p.contours.flat());
  if (points.length === 0) return null;
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const latMoy = (Math.min(...lats) + Math.max(...lats)) / 2;
  const mLat = RAYON_TERRE * RAD;
  const mLon = mLat * Math.cos(latMoy * RAD);
  const dLon = margeM / mLon;
  const dLat = margeM / mLat;
  const c = {
    ouest: Math.min(...lons) - dLon,
    est: Math.max(...lons) + dLon,
    sud: Math.min(...lats) - dLat,
    nord: Math.max(...lats) + dLat,
  };
  return { ...c, largeur: (c.est - c.ouest) * mLon, hauteur: (c.nord - c.sud) * mLat };
}

/** [longitude, latitude] → coordonnées SVG en mètres, origine en haut à gauche du cadre. */
export function projeter(cadre: Cadre, [lon, lat]: [number, number]): [number, number] {
  const x = ((lon - cadre.ouest) / (cadre.est - cadre.ouest)) * cadre.largeur;
  const y = ((cadre.nord - lat) / (cadre.nord - cadre.sud)) * cadre.hauteur;
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

/** Chemin SVG des contours d'une parcelle. */
export function cheminSvg(cadre: Cadre, contours: [number, number][][]): string {
  return contours
    .map((anneau) => anneau.map((pt, i) => `${i === 0 ? "M" : "L"}${projeter(cadre, pt).join(" ")}`).join(" ") + " Z")
    .join(" ");
}

/** Centre approximatif d'une parcelle, pour y poser son numéro. */
export function centre(cadre: Cadre, contours: [number, number][][]): [number, number] {
  const pts = (contours[0] ?? []).map((p) => projeter(cadre, p));
  if (pts.length === 0) return [0, 0];
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [x, y];
}

/** Fond orthophoto IGN pour le cadre (WMS 1.3.0, EPSG:4326 : axes latitude puis longitude). */
export function urlFondOrtho(cadre: Cadre, largeurPx = 900): string {
  const hauteurPx = Math.round((largeurPx * cadre.hauteur) / cadre.largeur);
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: "ORTHOIMAGERY.ORTHOPHOTOS",
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: [cadre.sud, cadre.ouest, cadre.nord, cadre.est].map((v) => v.toFixed(7)).join(","),
    WIDTH: String(largeurPx),
    HEIGHT: String(hauteurPx),
    FORMAT: "image/jpeg",
  });
  return `https://data.geopf.fr/wms-r/wms?${params.toString()}`;
}

/* ---------- Distance point / parcelle (API) ---------- */

/** Distance en mètres d'un point à un ensemble d'anneaux ; 0 si le point est à l'intérieur. */
export function distanceAuContour(point: [number, number], contours: [number, number][][]): number {
  const [lon0, lat0] = point;
  const mLat = RAYON_TERRE * RAD;
  const mLon = mLat * Math.cos(lat0 * RAD);
  const loc = ([lon, lat]: [number, number]): [number, number] => [(lon - lon0) * mLon, (lat - lat0) * mLat];
  let dedans = false;
  let d2 = Number.POSITIVE_INFINITY;
  for (const anneau of contours) {
    const pts = anneau.map(loc);
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[j];
      if (y1 > 0 !== y2 > 0 && 0 < ((x2 - x1) * (0 - y1)) / (y2 - y1) + x1) dedans = !dedans;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = dx || dy ? Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / (dx * dx + dy * dy))) : 0;
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      d2 = Math.min(d2, px * px + py * py);
    }
  }
  return dedans ? 0 : Math.sqrt(d2);
}
