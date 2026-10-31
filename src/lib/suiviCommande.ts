/**
 * Compteur du tunnel de commande (/commander), sur le modèle de celui de la
 * page Express (suivi.ts) : chaque événement est un fichier vide dans Vercel
 * Blob dont le CHEMIN porte toute l'information :
 * suivi/commande/<jour>/<étape>/<source>/<instant>-<id>_<formule>-<échéances>.txt.
 * Aucune donnée personnelle : ni nom, ni adresse, ni IP, ni cookie.
 *
 * Logique pure, testée ; l'accès au stockage est dans suiviCommandeStore.ts.
 */
import { formulesCommande, NOMBRES_ECHEANCES, type FormuleCommandeId, type NombreEcheances } from "./commande";
import { joursAvant, type SourceSuivi } from "./suivi";

export const PREFIXE_SUIVI_COMMANDE = "suivi/commande/";

/** Les étapes du tunnel, dans l'ordre du parcours : l'entonnoir du tableau de bord. */
export const ETAPES_TUNNEL = [
  ["panier", "Panier ouvert"],
  ["coordonnees", "Coordonnées affichées"],
  ["formulaire", "Formulaire commencé"],
  ["reglement", "Règlement affiché"],
  ["devis", "Devis affiché"],
  ["accepte", "Devis accepté"],
  ["signee", "Commande signée (IBAN)"],
] as const;

/** Hors entonnoir : le client part sans son RIB, ou la création chez Qonto échoue. */
export const ETAPES_ANNEXES = [
  ["plus-tard", "« Terminer plus tard »"],
  ["erreur", "Erreur à la création du devis"],
] as const;

export type EtapeCommande = (typeof ETAPES_TUNNEL)[number][0] | (typeof ETAPES_ANNEXES)[number][0];

const ETAPES: readonly EtapeCommande[] = [...ETAPES_TUNNEL, ...ETAPES_ANNEXES].map(([e]) => e);

/** Étapes envoyées par le navigateur ; les autres ne sont comptées que par le serveur, à l'action réelle. */
export const ETAPES_NAVIGATEUR: readonly EtapeCommande[] = ["panier", "coordonnees", "formulaire", "reglement"];

export interface EvenementCommande {
  jour: string; // AAAA-MM-JJ, heure de Paris
  etape: EtapeCommande;
  source: SourceSuivi;
  instant: number;
  formule: FormuleCommandeId | null;
  echeances: NombreEcheances | null;
}

export function estEtapeCommande(v: unknown): v is EtapeCommande {
  return typeof v === "string" && (ETAPES as readonly string[]).includes(v);
}

export function nettoyerFormule(v: unknown): FormuleCommandeId | null {
  return formulesCommande.find((f) => f.id === v)?.id ?? null;
}

export function nettoyerEcheances(v: unknown): NombreEcheances | null {
  return NOMBRES_ECHEANCES.find((n) => n === v) ?? null;
}

export function cheminCommande(e: EvenementCommande, id: string): string {
  return `${PREFIXE_SUIVI_COMMANDE}${e.jour}/${e.etape}/${e.source}/${e.instant}-${id}_${e.formule ?? "x"}-${e.echeances ?? "x"}.txt`;
}

/** Relit un chemin ; null pour tout chemin qui n'a pas la forme attendue. */
export function lireCheminCommande(chemin: string): EvenementCommande | null {
  if (!chemin.startsWith(PREFIXE_SUIVI_COMMANDE)) return null;
  const [jour = "", etape, source, fichier = ""] = chemin.slice(PREFIXE_SUIVI_COMMANDE.length).split("/");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !estEtapeCommande(etape)) return null;
  if (source !== "ads" && source !== "direct") return null;
  const m = /^(\d{12,14})-[^_]+_([a-z]+)-(\d+|x)\.txt$/.exec(fichier);
  if (!m) return null;
  return {
    jour,
    etape,
    source,
    instant: Number(m[1]),
    formule: nettoyerFormule(m[2]),
    echeances: nettoyerEcheances(Number(m[3])),
  };
}

export interface CompteursCommande {
  etapes: Record<EtapeCommande, number>;
  /** Même chose, pour les visites venues d'une annonce Google. */
  ads: Record<EtapeCommande, number>;
}

const zeros = () => Object.fromEntries(ETAPES.map((e) => [e, 0])) as Record<EtapeCommande, number>;

/** Totaux des événements dont le jour est >= `depuis` (tout l'historique si absent). */
export function compterCommande(evenements: EvenementCommande[], depuis?: string): CompteursCommande {
  const etapes = zeros();
  const ads = zeros();
  for (const e of evenements) {
    if (depuis && e.jour < depuis) continue;
    etapes[e.etape] += 1;
    if (e.source === "ads") ads[e.etape] += 1;
  }
  return { etapes, ads };
}

/** Commandes signées rapportées aux paniers ouverts, en pourcentage à une décimale ; null sans panier. */
export function tauxConversion(c: CompteursCommande): number | null {
  return c.etapes.panier ? Math.round((c.etapes.signee / c.etapes.panier) * 1000) / 10 : null;
}

/** Répartition d'une étape par formule ou par nombre d'échéances, du plus fréquent au moins fréquent. */
export function repartition(evenements: EvenementCommande[], etape: EtapeCommande, cle: "formule" | "echeances"): [string, number][] {
  const n = new Map<string, number>();
  for (const e of evenements) {
    const v = e[cle];
    if (e.etape === etape && v !== null) n.set(String(v), (n.get(String(v)) ?? 0) + 1);
  }
  return [...n.entries()].sort((a, b) => b[1] - a[1]);
}

/** Les `n` derniers jours, du plus récent au plus ancien, jours vides compris. */
export function parJourCommande(evenements: EvenementCommande[], aujourdhui: string, n: number): { jour: string; compteurs: CompteursCommande }[] {
  return Array.from({ length: n }, (_, i) => {
    const jour = joursAvant(aujourdhui, i);
    return { jour, compteurs: compterCommande(evenements.filter((e) => e.jour === jour)) };
  });
}
