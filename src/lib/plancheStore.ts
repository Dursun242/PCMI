import "server-only";
import { list, put } from "@vercel/blob";
import { lireJsonPublic } from "@/lib/blobPublic";
import { d1Configure, docEcrire, docLire, docLister } from "@/lib/d1";
import type { Planche } from "@/lib/planche";
import { empreinteDemande, empreinteParcelle, memeDemandeur } from "@/lib/plancheSecret";

/**
 * Registre des planches gratuites : une entrée par demande, nommée par
 * l'empreinte de la parcelle et de l'e-mail du visiteur (plancheSecret.ts).
 * C'est lui qui garantit « une planche par terrain et par personne » ; les
 * entrées plus anciennes sont nommées par la parcelle seule. Les coordonnées du visiteur y sont
 * chiffrées ; le reste (commune, référence cadastrale, planche, statut) est
 * public par nature. Stockage Cloudflare D1 (d1.ts) dès que ses variables sont posées, sinon Vercel Blob
 * (BLOB_READ_WRITE_TOKEN) ; en local, sans l'un ni l'autre, le registre vit en mémoire. Une demande enregistrée
 * dans Blob avant la bascule reste lue (lecture directe, sans opération comptée).
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
  if (d1Configure()) {
    const e = await docLire<EntreePlanche>(chemin(empreinte));
    if (e || !vercel()) return e;
    return lireJsonPublic<EntreePlanche>(chemin(empreinte), true);
  }
  if (!vercel()) return enMemoire().get(empreinte) ?? null;
  // lecture directe, sans list() (06/11/2026, quota Blob) ; fraîche : la livraison doit voir la demande enregistrée
  return lireJsonPublic<EntreePlanche>(chemin(empreinte), true);
}

export async function ecrirePlanche(e: EntreePlanche): Promise<void> {
  if (d1Configure()) return docEcrire(chemin(e.empreinte), e, e.maj);
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
  if (d1Configure()) return (await docLister<EntreePlanche>(PREFIXE, max)).map((d) => d.valeur).sort((a, b) => b.cree - a.cree);
  if (!vercel()) return [...enMemoire().values()].sort((a, b) => b.cree - a.cree).slice(0, max);
  const { blobs } = await list({ prefix: PREFIXE, limit: max });
  const entrees = await Promise.all(blobs.map((b) => lireBlob(b.url, b.uploadedAt).catch(() => null)));
  return entrees.filter((e): e is EntreePlanche => e !== null).sort((a, b) => b.cree - a.cree);
}

/**
 * Vrai si cette personne a déjà demandé une planche pour cette parcelle, même
 * en échec : la planche est alors préparée à la main et livrée quand même.
 * Relit aussi l'ancien registre (une entrée par parcelle) : son auteur reste
 * servi, les autres visiteurs ne sont plus bloqués.
 */
export async function demandeDejaFaite(idu: string, email: string, secret: string): Promise<boolean> {
  const [demande, ancienne] = await Promise.all([
    lirePlanche(empreinteDemande(idu, email, secret)),
    lirePlanche(empreinteParcelle(idu, secret)),
  ]);
  return demande !== null || (ancienne !== null && memeDemandeur(ancienne.contact, email, secret));
}
