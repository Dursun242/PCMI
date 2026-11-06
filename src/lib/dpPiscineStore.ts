import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { list, put } from "@vercel/blob";

/**
 * Registre des DP piscine en ligne (Vercel Blob) : une entrée par dossier.
 *
 * Le client garde un jeton (k) dans son lien de suivi ; le registre n'en garde
 * que l'empreinte. Les chemins de l'entrée et des fichiers payants portent une
 * signature du serveur : connaître l'identifiant du dossier ne suffit pas à
 * retrouver le PDF sans avoir payé. Coordonnées du client chiffrées
 * (plancheSecret.chiffrer). En local, sans BLOB_READ_WRITE_TOKEN, tout vit en
 * mémoire.
 */

export type StatutDp = "en_cours" | "pret" | "a_verifier" | "bloque" | "hors_dp" | "echec";

export interface ResumeDp {
  statut: StatutDp;
  motifRegime: string;
  pieces: string[];
  echecs: string[];
  aVerifier: string[];
  taxe: { base: number; total: number; tauxCommunal: number; tauxDep: number } | null;
  delai: string;
  distances: number[];
  arase: number | null;
}

export interface EntreeDp {
  id: string;
  jeton: string;
  /** Le jeton lui-même, chiffré : les e-mails suivants redonnent au client son lien de suivi. */
  jetonChiffre: string;
  cree: number;
  maj: number;
  statut: StatutDp;
  commune: string;
  reference: string;
  /** Prénom, nom, e-mail, téléphone, chiffrés. */
  contact: string;
  resume?: ResumeDp;
  apercus?: string[];
  guide?: string;
  fichiers?: { dossier?: string; cerfa?: string };
  paiement?: { lienId: string; url: string; cree: number };
  paye?: { le: number; mode: "qonto" | "test" };
  erreur?: string;
  /** Dossier vu et validé à la main par ID Maîtrise (statut « bloque » repris). */
  valideParIdm?: boolean;
}

const vercel = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const memoire = globalThis as typeof globalThis & { __pcmiDp?: Map<string, Map<string, Facette>>; __pcmiDpFichiers?: Map<string, Buffer> };
const enMemoire = () => (memoire.__pcmiDp ??= new Map());
export const fichiersEnMemoire = () => (memoire.__pcmiDpFichiers ??= new Map());

const signe = (id: string, usage: string, secret: string) =>
  createHmac("sha256", createHash("sha256").update(`dp-piscine:${usage}:${secret}`).digest()).update(id).digest("hex").slice(0, 32);

/**
 * Un dossier = plusieurs petits fichiers (« facettes ») sous un même préfixe signé : la fiche de départ, le résultat de
 * l'outil, chaque fichier livré, le lien de paiement, le paiement. Chaque envoi n'écrit que sa facette : deux envois
 * rapprochés (résultat puis plans puis Cerfa, 06/11/2026) ne peuvent plus s'écraser en relisant une version périmée.
 */
export type NomFacette = "base" | "erreur" | "resultat" | "fichier-dossier" | "fichier-cerfa" | "paiement" | "paye";
interface Facette {
  donnees: Partial<EntreeDp>;
  le: number;
}
const prefixe = (id: string, secret: string) => `dp-piscine/${id}-${signe(id, "entree", secret)}`;

export const nouveauJeton = () => randomBytes(24).toString("base64url");
export const empreinteJeton = (k: string) => createHash("sha256").update(k).digest("hex");

export function jetonValide(e: EntreeDp, k: string): boolean {
  const a = Buffer.from(empreinteJeton(k), "hex");
  const b = Buffer.from(e.jeton, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Facettes réunies, de la plus ancienne à la plus récente ; les fichiers livrés s'additionnent. */
function fusionner(facettes: Facette[]): EntreeDp | null {
  const triees = [...facettes].sort((a, b) => a.le - b.le);
  if (!triees.length) return null;
  let e = {} as EntreeDp;
  for (const f of triees) e = { ...e, ...f.donnees, fichiers: { ...e.fichiers, ...f.donnees.fichiers } };
  if (!e.id) return null;
  return { ...e, maj: triees.at(-1)!.le };
}

export async function lireDp(id: string, secret: string): Promise<EntreeDp | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  if (!vercel()) return fusionner([...(enMemoire().get(id)?.values() ?? [])]);
  // le préfixe couvre aussi l'ancienne entrée d'un seul fichier (« <prefixe>.json », dossiers d'avant le 06/11/2026)
  const { blobs } = await list({ prefix: prefixe(id, secret), limit: 50 });
  const lues = await Promise.all(
    blobs.map(async (b) => {
      const r = await fetch(`${b.url}?v=${b.uploadedAt.getTime()}`, { cache: "no-store" });
      return r.ok ? ({ donnees: (await r.json()) as Partial<EntreeDp>, le: b.uploadedAt.getTime() } satisfies Facette) : null;
    }),
  );
  return fusionner(lues.filter((f): f is Facette => f !== null));
}

/** Écrit une facette du dossier (elle remplace la précédente du même nom, jamais les autres). */
export async function ecrireFacette(id: string, secret: string, nom: NomFacette, donnees: Partial<EntreeDp>): Promise<void> {
  if (!vercel()) {
    const m = enMemoire().get(id) ?? new Map<string, Facette>();
    m.set(nom, { donnees, le: Date.now() + m.size * 1e-3 });
    enMemoire().set(id, m);
    return;
  }
  await put(`${prefixe(id, secret)}/${nom}.json`, JSON.stringify(donnees), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export const ecrireDp = (e: EntreeDp, secret: string) => ecrireFacette(e.id, secret, "base", e);

/** Écrit une facette puis relit le dossier entier. */
export async function majDp(id: string, secret: string, nom: NomFacette, patch: Partial<EntreeDp>): Promise<EntreeDp | null> {
  await ecrireFacette(id, secret, nom, patch);
  return lireDp(id, secret);
}

/**
 * Range un fichier du dossier. Les aperçus sont montrés au client ; le dossier
 * et le Cerfa sont rangés sous un chemin signé et aléatoire, donné seulement
 * après paiement. Renvoie l'adresse du fichier.
 */
export async function rangerFichier(
  id: string,
  secret: string,
  nom: string,
  contenu: Buffer,
  type: "application/pdf" | "image/jpeg",
): Promise<string> {
  const dossier = type === "image/jpeg" ? `dp-piscine-apercus/${id}` : `dp-piscine-fichiers/${signe(id, "fichiers", secret)}`;
  const cheminFichier = `${dossier}/${randomBytes(8).toString("hex")}-${nom}`;
  if (!vercel()) {
    fichiersEnMemoire().set(cheminFichier, contenu);
    return `/api/dp-piscine/fichier-local?p=${encodeURIComponent(cheminFichier)}`;
  }
  const b = await put(cheminFichier, contenu, { access: "public", contentType: type, addRandomSuffix: false, allowOverwrite: true });
  return b.url;
}
