import "server-only";
import { list, put } from "@vercel/blob";
import type { Planche } from "@/lib/planche";

/**
 * Registre des planches gratuites : une entrée par parcelle, nommée par
 * l'empreinte de la parcelle (plancheSecret.ts). C'est lui qui garantit
 * « une seule planche par parcelle ». Les coordonnées du visiteur y sont
 * chiffrées ; le reste (commune, référence cadastrale, planche, statut) est
 * public par nature. Stockage Vercel Blob (BLOB_READ_WRITE_TOKEN) ; en local,
 * sans jeton, le registre vit en mémoire.
 */

export type StatutPlanche = "en_cours" | "livree" | "echec";

export interface EntreePlanche {
  id: string;
  empreinte: string;
  planche: Planche;
  commune: string;
  /** « OJ 0646 ». */
  reference: string;
  cree: number;
  maj: number;
  statut: StatutPlanche;
  /** Prénom, nom et e-mail du visiteur, chiffrés (null sans secret). */
  contact: string | null;
  erreur?: string;
}

const PREFIXE = "planches-gratuites/";
const chemin = (empreinte: string) => `${PREFIXE}${empreinte}.json`;
const vercel = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const memoire = globalThis as typeof globalThis & { __pcmiPlanches?: Map<string, EntreePlanche> };
const enMemoire = () => (memoire.__pcmiPlanches ??= new Map());

async function lireBlob(url: string, version: Date): Promise<EntreePlanche | null> {
  // La version dans l'URL contourne le cache du CDN après une mise à jour du statut.
  const r = await fetch(`${url}?v=${version.getTime()}`, { cache: "no-store" });
  return r.ok ? ((await r.json()) as EntreePlanche) : null;
}

export async function lirePlanche(empreinte: string): Promise<EntreePlanche | null> {
  if (!vercel()) return enMemoire().get(empreinte) ?? null;
  const { blobs } = await list({ prefix: chemin(empreinte), limit: 1 });
  return blobs[0] ? lireBlob(blobs[0].url, blobs[0].uploadedAt) : null;
}

export async function ecrirePlanche(e: EntreePlanche): Promise<void> {
  if (!vercel()) {
    enMemoire().set(e.empreinte, e);
    return;
  }
  await put(chemin(e.empreinte), JSON.stringify(e), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function majPlanche(empreinte: string, patch: Partial<Pick<EntreePlanche, "statut" | "erreur">>) {
  const e = await lirePlanche(empreinte);
  if (!e) return null;
  const maj = { ...e, ...patch, maj: Date.now() };
  await ecrirePlanche(maj);
  return maj;
}

/** Les planches les plus récentes d'abord (espace d'administration). */
export async function listerPlanches(max = 200): Promise<EntreePlanche[]> {
  if (!vercel()) return [...enMemoire().values()].sort((a, b) => b.cree - a.cree).slice(0, max);
  const { blobs } = await list({ prefix: PREFIXE, limit: max });
  const entrees = await Promise.all(blobs.map((b) => lireBlob(b.url, b.uploadedAt).catch(() => null)));
  return entrees.filter((e): e is EntreePlanche => e !== null).sort((a, b) => b.cree - a.cree);
}

/**
 * Une parcelle est prise dès sa première demande, même en échec : la planche
 * est alors préparée à la main et livrée quand même (une seule par parcelle).
 */
export const parcellePrise = (e: EntreePlanche | null) => e !== null;
