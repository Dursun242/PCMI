/**
 * Générateur de panneau d'affichage d'une autorisation d'urbanisme
 * (permis de construire ou déclaration préalable).
 *
 * Mentions fixées par les articles A. 424-15 à A. 424-19 du code de
 * l'urbanisme. Tout le calcul vit ici (testé) : le composant ne fait que la
 * saisie et l'aperçu. Le SVG produit est au format réel 120 × 80 cm (unités
 * en millimètres), prêt pour un imprimeur, et c'est le même fichier qui sert
 * d'aperçu : ce qu'on voit est ce qu'on imprime.
 */

export type TypeAutorisation = "PC" | "DP";

export interface PanneauSaisie {
  type: TypeAutorisation;
  numero: string;
  /** Date ISO AAAA-MM-JJ. */
  dateDelivrance: string;
  beneficiaire: string;
  nature: string;
  /** Les nombres restent en texte : « 118,5 » doit pouvoir se saisir. */
  superficieTerrain: string;
  surfacePlancher: string;
  hauteur: string;
  surfaceDemolie: string;
  mairie: string;
  /** Secteur protégé : mention de l'avis de l'Architecte des Bâtiments de France. */
  secteurProtege: boolean;
  /** Petite ligne de crédit en pied de panneau. */
  credit: boolean;
}

export type ChampPanneau = keyof Omit<PanneauSaisie, "type" | "secteurProtege" | "credit">;

/** Longueurs maximales : elles garantissent que tout tient sur le panneau. */
export const LONGUEUR_MAX: Record<ChampPanneau, number> = {
  numero: 30,
  dateDelivrance: 10,
  beneficiaire: 60,
  nature: 100,
  superficieTerrain: 9,
  surfacePlancher: 8,
  hauteur: 6,
  surfaceDemolie: 8,
  mairie: 90,
};

export const TITRES: Record<TypeAutorisation, string> = {
  PC: "PERMIS DE CONSTRUIRE",
  DP: "DÉCLARATION PRÉALABLE",
};

/** Mention des droits de recours imposée par l'article A. 424-17. */
export const MENTION_RECOURS_TITRE = "Droit de recours :";
export const MENTION_RECOURS =
  "Le délai de recours contentieux est de deux mois à compter du premier jour d'une période continue de deux mois " +
  "d'affichage sur le terrain du présent panneau (art. R.\u00a0600-2 du code de l'urbanisme). Tout recours administratif " +
  "ou tout recours contentieux doit, à peine d'irrecevabilité, être notifié à l'auteur de la décision et au " +
  "bénéficiaire du permis ou de la décision prise sur la déclaration préalable. Cette notification doit être " +
  "adressée par lettre recommandée avec accusé de réception dans un délai de quinze jours francs à compter du " +
  "dépôt du recours (art. R.\u00a0600-1 du code de l'urbanisme).";

export const MENTION_ABF = "Projet situé en secteur protégé, soumis à l'avis de l'Architecte des Bâtiments de France.";
export const CREDIT = "Modèle de panneau : permis-maison-individuelle.fr";

export const PANNEAU_VIDE: PanneauSaisie = {
  type: "PC",
  numero: "",
  dateDelivrance: "",
  beneficiaire: "",
  nature: "Construction d'une maison individuelle",
  superficieTerrain: "",
  surfacePlancher: "",
  hauteur: "",
  surfaceDemolie: "",
  mairie: "",
  secteurProtege: false,
  credit: true,
};

const ESPACES_INSECABLES = /[  ]/g;

/** « 118,5 » ou « 118.5 » → 118.5 ; texte vide ou invalide → NaN. */
export function lireNombre(v: string): number {
  const t = v.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "" || !/^\d+(\.\d+)?$/.test(t)) return Number.NaN;
  return Number(t);
}

/**
 * Nombre au format français avec des espaces ordinaires : les espaces fines
 * insécables d'Intl ne sont pas présentes dans toutes les polices d'imprimeur.
 */
export function formatNombre(n: number, decimales = 2): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(ESPACES_INSECABLES, " ");
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « 2026-10-12 » → « 12 octobre 2026 », sans dépendre du fuseau du navigateur. */
export function formatDateLongue(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [annee, mois, jour] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  if (d.getUTCFullYear() !== annee || d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null;
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]} ${annee}`;
}

export type ErreursPanneau = Partial<Record<ChampPanneau, string>>;

const OBLIGATOIRES: [ChampPanneau, string][] = [
  ["numero", "Indiquez le numéro figurant sur l'arrêté."],
  ["dateDelivrance", "Indiquez la date de l'arrêté."],
  ["beneficiaire", "Indiquez le nom du bénéficiaire."],
  ["nature", "Décrivez la nature des travaux."],
  ["superficieTerrain", "Indiquez la superficie du terrain."],
  ["mairie", "Indiquez l'adresse de la mairie."],
];

/** Erreurs par champ ; un objet vide signifie que le panneau est complet. */
export function validerPanneau(s: PanneauSaisie): ErreursPanneau {
  const erreurs: ErreursPanneau = {};
  for (const [champ, message] of OBLIGATOIRES) {
    if (s[champ].trim() === "") erreurs[champ] = message;
  }
  for (const champ of Object.keys(LONGUEUR_MAX) as ChampPanneau[]) {
    if (s[champ].trim().length > LONGUEUR_MAX[champ]) {
      erreurs[champ] = `${LONGUEUR_MAX[champ]} caractères au maximum, pour que la mention reste lisible.`;
    }
  }
  if (!erreurs.dateDelivrance && formatDateLongue(s.dateDelivrance) === null) {
    erreurs.dateDelivrance = "Date invalide.";
  }
  const nombres: [ChampPanneau, boolean][] = [
    ["superficieTerrain", true],
    ["surfacePlancher", false],
    ["hauteur", false],
    ["surfaceDemolie", false],
  ];
  for (const [champ, obligatoire] of nombres) {
    if (erreurs[champ]) continue;
    const v = s[champ];
    if (!obligatoire && v.trim() === "") continue;
    const n = lireNombre(v);
    if (!Number.isFinite(n) || n <= 0) erreurs[champ] = "Saisissez un nombre, par exemple 118,5.";
  }
  if (!erreurs.hauteur && s.hauteur.trim() !== "" && lireNombre(s.hauteur) > 60) {
    erreurs.hauteur = "Hauteur en mètres par rapport au sol naturel, par exemple 6,40.";
  }
  return erreurs;
}

export interface Valeur {
  libelle: string;
  valeur: string;
}

/** Les valeurs chiffrées du panneau, dans l'ordre d'affichage ; les champs vides sont omis. */
export function valeursChiffrees(s: PanneauSaisie): Valeur[] {
  const lignes: [string, string, string][] = [
    ["Superficie du terrain", s.superficieTerrain, "m²"],
    ["Surface de plancher autorisée", s.surfacePlancher, "m²"],
    ["Hauteur / sol naturel", s.hauteur, "m"],
    ["Surface démolie", s.surfaceDemolie, "m²"],
  ];
  return lignes
    .filter(([, v]) => Number.isFinite(lireNombre(v)) && lireNombre(v) > 0)
    .map(([libelle, v, unite]) => ({ libelle, valeur: `${formatNombre(lireNombre(v))} ${unite}` }));
}

/**
 * Découpe un texte en lignes d'au plus `max` caractères, aux espaces. Un mot
 * plus long que la ligne est coupé net plutôt que de déborder du panneau.
 */
export function decouper(texte: string, max: number): string[] {
  // Seules les espaces ordinaires sont des points de coupure : une insécable lie « R. 600-1 ».
  const mots = texte.trim().split(/[ \t\n]+/).filter(Boolean);
  const lignes: string[] = [];
  let courante = "";
  for (const mot of mots) {
    const morceaux = mot.length > max ? (mot.match(new RegExp(`.{1,${max}}`, "g")) ?? [mot]) : [mot];
    for (const m of morceaux) {
      const essai = courante ? `${courante} ${m}` : m;
      if (essai.length <= max) {
        courante = essai;
      } else {
        if (courante) lignes.push(courante);
        courante = m;
      }
    }
  }
  if (courante) lignes.push(courante);
  return lignes;
}

/**
 * Largeur moyenne d'un caractère d'Arial gras, en fraction de la taille de
 * police. Prise large exprès : mieux vaut une ligne un peu courte qu'un débord.
 */
export const CHASSE_GRAS = 0.58;
/** Même chose pour le romain (texte non gras). */
export const CHASSE_ROMAIN = 0.48;

/** Caractères qui tiennent sur `largeur` mm à la taille `taille`. */
export function capacite(largeur: number, taille: number, chasse = CHASSE_GRAS): number {
  return Math.floor(largeur / (taille * chasse));
}

/**
 * Plus grande taille de police (de `max` à `min`, par pas de 2) qui fait tenir
 * le texte en `lignesMax` lignes. Sous `min`, on garde `min` et on tronque.
 */
export function ajuster(texte: string, largeur: number, max: number, min: number, lignesMax: number, chasse = CHASSE_GRAS) {
  for (let taille = max; taille >= min; taille -= 2) {
    const lignes = decouper(texte, capacite(largeur, taille, chasse));
    if (lignes.length <= lignesMax) return { taille, lignes };
  }
  return { taille: min, lignes: decouper(texte, capacite(largeur, min, chasse)).slice(0, lignesMax) };
}

/** Échappe le texte saisi avant de l'insérer dans le SVG. */
export function echapperXml(t: string): string {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Dimensions du panneau en millimètres : 120 × 80 cm, le format standard. */
export const LARGEUR = 1200;
export const HAUTEUR = 800;
const MARGE = 20;
const X = 60;
const CONTENU = LARGEUR - 2 * X;
const ENCRE = "#1b1f1d";
const GRIS = "#4a524d";
const LAITON = "#d9c69d";
const FOND_RECOURS = "#f2f0eb";
const POLICE = "Arial, Helvetica, sans-serif";

type Element = string;

function texte(x: number, y: number, t: string, taille: number, opts: { gras?: boolean; couleur?: string; ancre?: "start" | "middle" | "end"; espacement?: number; italique?: boolean } = {}): Element {
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${POLICE}"`,
    `font-size="${taille}"`,
    `fill="${opts.couleur ?? ENCRE}"`,
    opts.gras ? `font-weight="700"` : "",
    opts.italique ? `font-style="italic"` : "",
    opts.ancre && opts.ancre !== "start" ? `text-anchor="${opts.ancre}"` : "",
    opts.espacement ? `letter-spacing="${opts.espacement}"` : "",
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${echapperXml(t)}</text>`;
}

const TAILLE_LIBELLE = 18;
const libelle = (x: number, y: number, t: string) =>
  texte(x, y, t.toUpperCase(), TAILLE_LIBELLE, { couleur: GRIS, espacement: 1.5 });

/** Un libellé en majuscules espacées occupe environ 0,72 em par caractère. */
const capaciteLibelle = (largeur: number) => Math.floor(largeur / (TAILLE_LIBELLE * 0.66 + 1.5));

export interface MiseEnPage {
  elements: Element[];
  /** Ordonnée du bas du dernier bloc de mentions, pour vérifier qu'il ne chevauche pas le cadre des recours. */
  basMentions: number;
  hautRecours: number;
}

/** Un bloc de mentions : sa hauteur, et de quoi le dessiner à partir d'une ordonnée. */
interface Bloc {
  hauteur: number;
  dessiner: (y: number) => Element[];
}

function blocsMentions(s: PanneauSaisie): Bloc[] {
  const blocs: Bloc[] = [];

  const benef = ajuster(s.beneficiaire, CONTENU, 46, 30, 1);
  blocs.push({
    hauteur: 54,
    dessiner: (y) => [libelle(X, y, "Bénéficiaire"), texte(X, y + 44, benef.lignes[0] ?? "", benef.taille, { gras: true })],
  });

  const nature = ajuster(s.nature, CONTENU, 40, 26, 2);
  blocs.push({
    hauteur: 18 + nature.lignes.length * 41,
    dessiner: (y) => [
      libelle(X, y, "Nature des travaux"),
      ...nature.lignes.map((l, i) => texte(X, y + 41 + i * 41, l, nature.taille, { gras: true })),
    ],
  });

  // Valeurs chiffrées, en colonnes ; un libellé trop long passe sur deux lignes.
  const valeurs = valeursChiffrees(s);
  if (valeurs.length > 0) {
    const col = CONTENU / valeurs.length;
    const libelles = valeurs.map((v) => decouper(v.libelle, capaciteLibelle(col - 16)).slice(0, 2));
    const decalage = (Math.max(...libelles.map((l) => l.length)) - 1) * 20;
    const tailles = valeurs.map((v) => ajuster(v.valeur, col - 24, 44, 26, 1));
    blocs.push({
      hauteur: 58 + decalage,
      dessiner: (y) =>
        valeurs.flatMap((v, i) => [
          ...libelles[i].map((l, j) => libelle(X + i * col, y + j * 20, l)),
          texte(X + i * col, y + decalage + 47, tailles[i].lignes[0] ?? "", tailles[i].taille, { gras: true }),
        ]),
    });
  }

  const mairie = ajuster(s.mairie, CONTENU, 30, 22, 2, CHASSE_ROMAIN);
  blocs.push({
    hauteur: 12 + mairie.lignes.length * 34,
    dessiner: (y) => [
      libelle(X, y, "Le dossier peut être consulté à la mairie"),
      ...mairie.lignes.map((l, i) => texte(X, y + 36 + i * 34, l, mairie.taille)),
    ],
  });

  if (s.secteurProtege) {
    blocs.push({ hauteur: 12, dessiner: (y) => [texte(X, y + 4, MENTION_ABF, 22, { italique: true })] });
  }
  return blocs;
}

/** Espace minimal et maximal entre deux blocs de mentions. */
const ECART_MIN = 14;
const ECART_MAX = 44;
const HAUT_MENTIONS = 184;

/**
 * Calcule la position de chaque élément du panneau. Les mentions se répartissent
 * dans l'espace libre entre le bandeau et le cadre des recours : un panneau
 * court s'aère, un panneau chargé se resserre.
 */
export function miseEnPage(s: PanneauSaisie): MiseEnPage {
  const el: Element[] = [];
  const titre = TITRES[s.type];
  const date = formatDateLongue(s.dateDelivrance) ?? s.dateDelivrance;

  // Bandeau.
  el.push(`<rect x="${MARGE}" y="${MARGE}" width="${LARGEUR - 2 * MARGE}" height="130" fill="${ENCRE}"/>`);
  el.push(texte(LARGEUR / 2, 98, titre, titre.length > 20 ? 64 : 72, { gras: true, couleur: "#ffffff", ancre: "middle", espacement: 4 }));
  const sousTitre = [`N° ${s.numero.trim().toUpperCase()}`, date ? `délivré le ${date}` : ""].filter(Boolean).join("   ·   ");
  el.push(texte(LARGEUR / 2, 135, sousTitre, 26, { couleur: LAITON, ancre: "middle", espacement: 1 }));

  // Droits de recours, calés en bas du panneau.
  const tailleRecours = 17;
  const interligne = 23;
  const lignesRecours = decouper(MENTION_RECOURS, capacite(CONTENU - 10, tailleRecours, CHASSE_ROMAIN));
  const hauteurRecours = 70 + lignesRecours.length * interligne;
  const hautRecours = HAUTEUR - MARGE - 14 - hauteurRecours;

  // Mentions, réparties entre le bandeau et les recours.
  const blocs = blocsMentions(s);
  const occupe = blocs.reduce((t, b) => t + b.hauteur, 0);
  const libre = hautRecours - HAUT_MENTIONS - occupe - ECART_MIN;
  const ecart = Math.min(ECART_MAX, Math.max(ECART_MIN, libre / blocs.length));
  let y = HAUT_MENTIONS;
  for (const b of blocs) {
    el.push(...b.dessiner(y));
    y += b.hauteur + ecart;
  }
  const basMentions = y - ecart;

  el.push(`<rect x="${X - 20}" y="${hautRecours}" width="${CONTENU + 40}" height="${hauteurRecours}" fill="${FOND_RECOURS}"/>`);
  el.push(texte(X, hautRecours + 38, MENTION_RECOURS_TITRE, 22, { gras: true }));
  lignesRecours.forEach((l, i) => el.push(texte(X, hautRecours + 70 + i * interligne, l, tailleRecours)));

  if (s.credit) {
    el.push(texte(LARGEUR - X, HAUTEUR - MARGE - 3, CREDIT, 9, { couleur: GRIS, ancre: "end" }));
  }

  return { elements: el, basMentions, hautRecours };
}

/** Le panneau complet, en SVG autonome au format réel 120 × 80 cm. */
export function svgPanneau(s: PanneauSaisie): string {
  const { elements } = miseEnPage(s);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}mm" height="${HAUTEUR}mm" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">`,
    `<rect width="${LARGEUR}" height="${HAUTEUR}" fill="#ffffff"/>`,
    `<rect x="${MARGE / 2}" y="${MARGE / 2}" width="${LARGEUR - MARGE}" height="${HAUTEUR - MARGE}" fill="none" stroke="${ENCRE}" stroke-width="4"/>`,
    ...elements,
    `</svg>`,
  ].join("\n");
}

/** Nom de fichier lisible, sans caractère interdit. */
export function nomFichier(s: PanneauSaisie): string {
  const numero = s.numero
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `panneau-${s.type.toLowerCase()}${numero ? `-${numero}` : ""}.svg`;
}
