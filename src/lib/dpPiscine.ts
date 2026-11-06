/**
 * DP piscine en ligne : le client fait lui-même sa déclaration préalable de
 * piscine (terrain, bassin dessiné sur la vue aérienne, coordonnées), voit
 * l'aperçu de son dossier, puis paie pour le télécharger.
 *
 * Logique pure, sans React ni réseau : validation de la saisie, géométrie du
 * bassin sur la carte (mètres <-> degrés autour du bassin), fiche envoyée au
 * workflow « DP piscine (site) » d'id-plans (outils/dp_piscine_site.py, qui
 * revalide tout).
 */

import { estIdu } from "@/lib/planche";

export const PRIX_DP_PISCINE_TTC = 100;
export const TVA_DP_PISCINE = 0.2;
export const CHEMIN_DP_PISCINE = "/dp-piscine";

export type CoteBassin = "petit_cote_1" | "petit_cote_2" | "grand_cote_1" | "grand_cote_2";
export const COTES: CoteBassin[] = ["petit_cote_2", "grand_cote_2", "petit_cote_1", "grand_cote_1"];

export type TypeBassin = "enterree" | "semi-enterree" | "hors-sol";
export type Securite = "alarme" | "couverture" | "barriere" | "abri";

export const TYPES_BASSIN: Record<TypeBassin, string> = {
  enterree: "Enterrée",
  "semi-enterree": "Semi-enterrée",
  "hors-sol": "Hors-sol (fixe)",
};

export const SECURITES: Record<Securite, string> = {
  alarme: "Alarme (NF P90-307)",
  couverture: "Couverture de sécurité (NF P90-308)",
  barriere: "Barrière de 1,10 m (NF P90-306)",
  abri: "Abri bas (NF P90-309)",
};

export interface Bassin {
  longueur: number;
  largeur: number;
  profondeur: number;
  margelle: number;
  plage: Record<CoteBassin, number>;
  localTechnique: boolean;
  type: TypeBassin;
  securite: Securite;
  visibleRue: boolean;
  /** Centre du bassin, [longitude, latitude]. */
  centre: [number, number];
  /** Orientation du grand côté, en degrés depuis l'est, sens trigonométrique. */
  angle: number;
}

/** Photos du client (piscine visible de la rue) : adresses Vercel Blob, 4 coins du bassin sur la photo proche. */
export interface PhotosDp {
  proche?: string;
  lointaine?: string;
  coins?: [number, number][];
  /** Taille de la photo proche (px) sur laquelle les coins ont été relevés. */
  repere?: [number, number];
}

export const photosCompletes = (p: PhotosDp | undefined): boolean =>
  Boolean(p?.proche && p.lointaine && p.coins?.length === 4 && p.repere);

const URL_BLOB = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+$/i;

function validerPhotos(v: unknown): PhotosDp | null {
  if (!v || typeof v !== "object") return {};
  const p = v as Record<string, unknown>;
  const out: PhotosDp = {};
  for (const k of ["proche", "lointaine"] as const) {
    if (p[k] === undefined || p[k] === null || p[k] === "") continue;
    if (typeof p[k] !== "string" || !URL_BLOB.test(p[k] as string)) return null;
    out[k] = p[k] as string;
  }
  const rep = Array.isArray(p.repere) ? p.repere.map(Number) : [];
  const coins = Array.isArray(p.coins) ? p.coins : [];
  if (coins.length) {
    if (coins.length !== 4 || rep.length !== 2 || !rep.every((n) => Number.isFinite(n) && n > 0 && n <= 20000)) return null;
    const c = coins.map((x) => (Array.isArray(x) ? x.map(Number) : []));
    if (!c.every((x) => x.length === 2 && x.every((n, i) => Number.isFinite(n) && n >= 0 && n <= rep[i]))) return null;
    out.coins = c as [number, number][];
    out.repere = rep as [number, number];
  }
  return out;
}

export interface DemandeDp {
  /** Première parcelle du terrain (référence du dossier). */
  idu: string;
  /** Toutes les parcelles du terrain (1 à 6), la première en tête. */
  idus: string[];
  voie: string;
  ville: string;
  commune: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  residence: "principale" | "secondaire";
  bassin: Bassin;
  photos: PhotosDp;
}

export type ErreursDp = Partial<Record<"idu" | "voie" | "ville" | "prenom" | "nom" | "email" | "telephone" | "bassin" | "photos" | "consentement", string>>;

export const BORNES = {
  longueur: [2, 25],
  largeur: [1.5, 12],
  profondeur: [0.6, 3],
  margelle: [0.15, 0.6],
  plage: [0, 6],
} as const;

/** Surface du bassin (eau), m². */
export const surfaceBassin = (b: Pick<Bassin, "longueur" | "largeur">): number => Math.round(b.longueur * b.largeur * 100) / 100;

/** Régime d'autorisation vu du formulaire (le générateur le revérifie avec les servitudes du terrain). */
export function regimeIndicatif(b: Pick<Bassin, "longueur" | "largeur">): "aucune" | "dp" | "pc" {
  const s = surfaceBassin(b);
  if (s <= 10) return "aucune";
  if (s > 100) return "pc";
  return "dp";
}

/* ---------- Géométrie sur la carte ---------- */

const M_PAR_DEG_LAT = 111_132;
const mParDegLon = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

/** Point à (dx, dy) mètres (est, nord) d'un point [lon, lat]. */
export function decaler([lon, lat]: [number, number], dx: number, dy: number): [number, number] {
  return [lon + dx / mParDegLon(lat), lat + dy / M_PAR_DEG_LAT];
}

/** Écart (dx, dy) en mètres de a vers b. */
export function ecart(a: [number, number], b: [number, number]): [number, number] {
  return [(b[0] - a[0]) * mParDegLon(a[1]), (b[1] - a[1]) * M_PAR_DEG_LAT];
}

/** Rectangle dans le repère du bassin (x le long du grand côté, y à gauche), de x0..x1 et y0..y1 mètres. */
export function rectangle(b: Pick<Bassin, "centre" | "angle">, x0: number, x1: number, y0: number, y1: number): [number, number][] {
  const a = (b.angle * Math.PI) / 180;
  const ux = [Math.cos(a), Math.sin(a)];
  const uy = [-Math.sin(a), Math.cos(a)];
  return ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as const).map(([x, y]) =>
    decaler(b.centre, x * ux[0] + y * uy[0], x * ux[1] + y * uy[1]),
  );
}

/** Contours du bassin (eau), des margelles, de la plage et du local technique, en [lon, lat]. */
export function formesBassin(b: Bassin) {
  const L = b.longueur / 2;
  const l = b.largeur / 2;
  const m = b.margelle;
  const p = b.plage;
  const plage = rectangle(b, -L - m - p.petit_cote_1, L + m + p.petit_cote_2, -l - m - p.grand_cote_1, l + m + p.grand_cote_2);
  const xl = L + m + p.petit_cote_2 + 1;
  return {
    bassin: rectangle(b, -L, L, -l, l),
    margelles: rectangle(b, -L - m, L + m, -l - m, l + m),
    plage,
    local: b.localTechnique ? rectangle(b, xl, xl + 1.5, -1, 1) : null,
  };
}

const CARDINAUX = ["est", "nord-est", "nord", "nord-ouest", "ouest", "sud-ouest", "sud", "sud-est"];

/** Orientation d'un côté du bassin (« nord-est »), pour nommer les plages. */
export function orientationCote(angle: number, cote: CoteBassin): string {
  const decal: Record<CoteBassin, number> = { petit_cote_2: 0, grand_cote_2: 90, petit_cote_1: 180, grand_cote_1: 270 };
  const d = (((angle + decal[cote]) % 360) + 360) % 360;
  return CARDINAUX[Math.round(d / 45) % 8];
}

/** Angle (degrés) du plus long côté d'une parcelle : le bassin part aligné sur le terrain. */
export function angleTerrain(contour: [number, number][]): number {
  let best = 0;
  let angle = 0;
  for (let i = 0; i + 1 < contour.length; i++) {
    const [dx, dy] = ecart(contour[i], contour[i + 1]);
    const d = Math.hypot(dx, dy);
    if (d > best) {
      best = d;
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }
  }
  return ((angle % 180) + 180) % 180;
}

/** Centre de gravité approché d'un contour (moyenne des sommets). */
export function centreContour(contour: [number, number][]): [number, number] {
  const pts = contour.length > 1 && contour[0][0] === contour.at(-1)?.[0] ? contour.slice(0, -1) : contour;
  return [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
}

/** Vrai si le point est dans le polygone (lancer de rayon). */
export function dansPolygone([x, y]: [number, number], poly: [number, number][]): boolean {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

/** Recul aux limites demandé par la plupart des PLU (le générateur applique la règle lue dans le PLU du terrain). */
export const RECUL_CONSEILLE_M = 3;

function pointSegment(p: [number, number], a: [number, number], b: [number, number]): [number, [number, number]] {
  const [abx, aby] = [b[0] - a[0], b[1] - a[1]];
  const l2 = abx * abx + aby * aby;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / l2)) : 0;
  const q: [number, number] = [a[0] + t * abx, a[1] + t * aby];
  return [Math.hypot(p[0] - q[0], p[1] - q[1]), q];
}

type Segment = [[number, number], [number, number]];

/** Anneau fermé (le dernier point répète le premier) : ses côtés. */
function cotesAnneau(r: [number, number][]): Segment[] {
  const pts = r.length > 1 && r[0][0] === r.at(-1)?.[0] && r[0][1] === r.at(-1)?.[1] ? r.slice(0, -1) : r;
  return pts.map((p, i) => [p, pts[(i + 1) % pts.length]] as Segment);
}

/**
 * Limites extérieures d'un terrain de plusieurs parcelles, en mètres autour de o : un côté commun à deux parcelles du
 * terrain (son milieu à moins de 0,5 m d'une autre parcelle) n'est pas une limite séparative.
 */
function limitesExterieures(anneaux: [number, number][][], o: [number, number]): Segment[] {
  const m = (p: [number, number]) => ecart(o, p);
  const cotes = anneaux.map((r) => cotesAnneau(r).map(([a, b]) => [m(a), m(b)] as Segment));
  return cotes.flatMap((liste, i) =>
    liste.filter(([a, b]) => {
      const mil: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return !cotes.some((autre, j) => j !== i && autre.some(([c, d]) => pointSegment(mil, c, d)[0] < 0.5));
    }),
  );
}

/** Le point est-il sur le terrain (dans l'une de ses parcelles) ? */
export const dansTerrain = (pt: [number, number], anneaux: [number, number][][]): boolean => anneaux.some((r) => dansPolygone(pt, r));

/**
 * Plus courte distance (m) du bassin aux limites extérieures du terrain (une ou plusieurs parcelles), et ses deux
 * extrémités [lon, lat] : affichée en direct au client et tracée sur la carte (même calcul que le contrôle du
 * générateur, à quelques centimètres près).
 */
export function distanceLimites(bassin: [number, number][], anneaux: [number, number][][]): { d: number; de: [number, number]; a: [number, number] } | null {
  if (bassin.length < 3 || !anneaux.some((r) => r.length >= 3)) return null;
  const o = bassin[0];
  const lonlat = ([x, y]: [number, number]) => decaler(o, x, y);
  const B = bassin.map((p) => ecart(o, p));
  const lim = limitesExterieures(anneaux.filter((r) => r.length >= 3), o);
  let best: { d: number; de: [number, number]; a: [number, number] } | null = null;
  const essayer = (d: number, de: [number, number], a: [number, number]) => {
    if (!best || d < best.d) best = { d, de, a };
  };
  for (const [c, d] of lim) for (const p of B) { const [x, q] = pointSegment(p, c, d); essayer(x, p, q); }
  for (let i = 0; i < B.length; i++) for (const [c] of lim) { const [x, q] = pointSegment(c, B[i], B[(i + 1) % B.length]); essayer(x, q, c); }
  const r = best as { d: number; de: [number, number]; a: [number, number] } | null;
  return r ? { d: Math.round(r.d * 100) / 100, de: lonlat(r.de), a: lonlat(r.a) } : null;
}

/* ---------- Validation (serveur) ---------- */

const TEXTE = /^[\p{L}\p{N}\s'’\-.,/°()&]+$/u;
const EMAIL = /^[^@\s]{1,64}@[^@\s]{1,120}\.[a-zA-Z]{2,}$/;

function texte(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max && TEXTE.test(t) ? t : null;
}

function nombre(v: unknown, [min, max]: readonly [number, number]): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 100) / 100 : null;
}

function validerBassin(v: unknown): Bassin | null {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  const longueur = nombre(b.longueur, BORNES.longueur);
  const largeur = nombre(b.largeur, BORNES.largeur);
  const profondeur = nombre(b.profondeur, BORNES.profondeur);
  const margelle = nombre(b.margelle, BORNES.margelle);
  const angle = nombre(b.angle, [-360, 360]);
  const c = Array.isArray(b.centre) ? b.centre : [];
  const lon = nombre(c[0], [-6, 10]);
  const lat = nombre(c[1], [41, 52]);
  const pl = (b.plage ?? {}) as Record<string, unknown>;
  const plage = Object.fromEntries(COTES.map((k) => [k, nombre(pl[k], BORNES.plage)])) as Record<CoteBassin, number | null>;
  if ([longueur, largeur, profondeur, margelle, angle].some((x) => x === null)) return null;
  if (lon === null || lat === null || COTES.some((k) => plage[k] === null)) return null;
  const type = b.type as TypeBassin;
  const securite = b.securite as Securite;
  if (!(type in TYPES_BASSIN) || !(securite in SECURITES)) return null;
  // Coordonnées gardées à 7 décimales (≈ 1 cm) : nombre() les arrondirait au mètre.
  const centre: [number, number] = [Number(Number(c[0]).toFixed(7)), Number(Number(c[1]).toFixed(7))];
  const [L, l] = (longueur as number) >= (largeur as number) ? [longueur as number, largeur as number] : [largeur as number, longueur as number];
  return {
    longueur: L,
    largeur: l,
    profondeur: profondeur as number,
    margelle: margelle as number,
    plage: plage as Record<CoteBassin, number>,
    localTechnique: b.localTechnique === true,
    type,
    securite,
    visibleRue: b.visibleRue === true,
    centre,
    angle: angle as number,
  };
}

export function validerDemandeDp(corps: Record<string, unknown>): { demande: DemandeDp } | { erreurs: ErreursDp } {
  const e: ErreursDp = {};
  const brutes = Array.isArray(corps.idus) ? corps.idus : [corps.idu];
  const idus = [...new Set(brutes.filter((x): x is string => typeof x === "string").map((x) => x.toUpperCase()))];
  const idu = idus[0] ?? "";
  if (!idus.length || idus.length > 6 || !idus.every(estIdu)) e.idu = "Choisissez la ou les parcelles de votre terrain sur la carte (6 au plus).";
  const voie = texte(corps.voie, 120);
  const ville = texte(corps.ville, 80);
  if (!voie) e.voie = "Adresse du terrain manquante.";
  if (!ville) e.ville = "Commune du terrain manquante.";
  const prenom = texte(corps.prenom, 60);
  const nom = texte(corps.nom, 60);
  if (!prenom) e.prenom = "Votre prénom.";
  if (!nom) e.nom = "Votre nom.";
  const email = typeof corps.email === "string" ? corps.email.trim() : "";
  if (!EMAIL.test(email)) e.email = "Une adresse e-mail valide : votre dossier y est envoyé.";
  const telephone = typeof corps.telephone === "string" ? corps.telephone.replace(/[^\d+]/g, "") : "";
  if (telephone && !/^\+?\d{9,15}$/.test(telephone)) e.telephone = "Numéro de téléphone invalide.";
  const bassin = validerBassin(corps.bassin);
  if (!bassin) e.bassin = "Dimensions ou position du bassin invalides.";
  else if (regimeIndicatif(bassin) !== "dp") e.bassin = "Ce bassin ne relève pas d'une déclaration préalable.";
  const photos = validerPhotos(corps.photos);
  if (!photos) e.photos = "Photos invalides : reprenez-les.";
  else if (bassin?.visibleRue && !photosCompletes(photos))
    e.photos = "Piscine visible de la rue : photo de près, photo de loin et les 4 coins du bassin sont nécessaires.";
  if (corps.consentement !== true) e.consentement = "Merci d'accepter l'utilisation de vos informations pour votre dossier.";
  if (Object.keys(e).length) return { erreurs: e };
  return {
    demande: {
      idu,
      idus,
      voie: voie as string,
      ville: ville as string,
      commune: texte(corps.commune, 80) ?? (ville as string),
      prenom: prenom as string,
      nom: (nom as string).toUpperCase(),
      email,
      telephone,
      residence: corps.residence === "secondaire" ? "secondaire" : "principale",
      bassin: bassin as Bassin,
      photos: photos ?? {},
    },
  };
}

/** Fiche transmise au workflow (format de outils/dp_piscine_site.py). */
export function ficheWorkflow(d: DemandeDp) {
  const b = d.bassin;
  const a = (b.angle * Math.PI) / 180;
  return {
    client: `${d.prenom} ${d.nom}`,
    adresse: d.voie,
    ville: d.ville,
    parcelle: d.idus.length > 1 ? d.idus : d.idu,
    residence: d.residence,
    demandeur: { nom: d.nom, prenom: d.prenom, email: d.email, ...(d.telephone ? { telephone: d.telephone } : {}) },
    piscine: {
      longueur: b.longueur,
      largeur: b.largeur,
      profondeur: b.profondeur,
      margelle: b.margelle,
      plage: b.plage,
      type: b.type,
      securite: b.securite,
      visible_rue: b.visibleRue,
      local_technique: b.localTechnique ? { longueur: 2, largeur: 1.5, hauteur: 2 } : null,
      centre_wgs84: b.centre,
      // point à 5 m dans l'axe du grand côté : le générateur en tire l'angle exact en Lambert 93
      axe_wgs84: decaler(b.centre, 5 * Math.cos(a), 5 * Math.sin(a)),
    },
    ...(d.photos.proche || d.photos.lointaine
      ? {
          photos: {
            ...(d.photos.proche ? { proche: d.photos.proche } : {}),
            ...(d.photos.lointaine ? { lointaine: d.photos.lointaine } : {}),
            ...(d.photos.proche && d.photos.coins?.length === 4 ? { insertion: { photo: "proche", coins_px: d.photos.coins, repere_px: d.photos.repere } } : {}),
          },
        }
      : {}),
  };
}

/** Prix hors taxe (lien de paiement Qonto : prix unitaire HT + taux de TVA). */
export const prixHt = (ttc = PRIX_DP_PISCINE_TTC, tva = TVA_DP_PISCINE): string => (ttc / (1 + tva)).toFixed(2);
