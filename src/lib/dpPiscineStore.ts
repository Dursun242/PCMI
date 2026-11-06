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
const memoire = globalThis as typeof globalThis & { __pcmiDp?: Map<string, EntreeDp>; __pcmiDpFichiers?: Map<string, Buffer> };
const enMemoire = () => (memoire.__pcmiDp ??= new Map());
export const fichiersEnMemoire = () => (memoire.__pcmiDpFichiers ??= new Map());

const signe = (id: string, usage: string, secret: string) =>
  createHmac("sha256", createHash("sha256").update(`dp-piscine:${usage}:${secret}`).digest()).update(id).digest("hex").slice(0, 32);

const chemin = (id: string, secret: string) => `dp-piscine/${id}-${signe(id, "entree", secret)}.json`;

export const nouveauJeton = () => randomBytes(24).toString("base64url");
export const empreinteJeton = (k: string) => createHash("sha256").update(k).digest("hex");

export function jetonValide(e: EntreeDp, k: string): boolean {
  const a = Buffer.from(empreinteJeton(k), "hex");
  const b = Buffer.from(e.jeton, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function lireDp(id: string, secret: string): Promise<EntreeDp | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  if (!vercel()) return enMemoire().get(id) ?? null;
  const { blobs } = await list({ prefix: chemin(id, secret), limit: 1 });
  if (!blobs[0]) return null;
  const r = await fetch(`${blobs[0].url}?v=${blobs[0].uploadedAt.getTime()}`, { cache: "no-store" });
  return r.ok ? ((await r.json()) as EntreeDp) : null;
}

export async function ecrireDp(e: EntreeDp, secret: string): Promise<void> {
  if (!vercel()) {
    enMemoire().set(e.id, e);
    return;
  }
  await put(chemin(e.id, secret), JSON.stringify(e), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function majDp(id: string, secret: string, patch: Partial<EntreeDp>): Promise<EntreeDp | null> {
  const e = await lireDp(id, secret);
  if (!e) return null;
  const maj = { ...e, ...patch, maj: Date.now() };
  await ecrireDp(maj, secret);
  return maj;
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
