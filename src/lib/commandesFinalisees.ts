import "server-only";
import { createHash } from "node:crypto";
import { del, list, put } from "@vercel/blob";

/**
 * Marque des commandes déjà confirmées, pour ne jamais envoyer deux fois la
 * confirmation et la fiche : deux onglets ouverts (le tunnel et le lien de
 * reprise), un double clic ou un rechargement peuvent finaliser la même
 * commande. Le nom du fichier est une empreinte du mandat : aucune donnée
 * personnelle n'est écrite. Sans stockage Vercel (en local), la marque est
 * gardée en mémoire.
 */

const PREFIXE = "commandes-finalisees/";
const empreinte = (mandatId: string) => createHash("sha256").update(`pcmi-finalisee:${mandatId}`).digest("hex").slice(0, 32);

const memoire = globalThis as typeof globalThis & { __pcmiCommandesFinalisees?: Set<string> };
const enMemoire = () => (memoire.__pcmiCommandesFinalisees ??= new Set());
const stockageVercel = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function dejaFinalisee(mandatId: string): Promise<boolean> {
  const cle = empreinte(mandatId);
  if (!stockageVercel()) return enMemoire().has(cle);
  return (await list({ prefix: `${PREFIXE}${cle}`, limit: 1 })).blobs.length > 0;
}

/** Pose la marque ; renvoie de quoi l'ôter si l'envoi des e-mails échoue ensuite. */
export async function marquerFinalisee(mandatId: string): Promise<() => Promise<void>> {
  const cle = empreinte(mandatId);
  if (!stockageVercel()) {
    enMemoire().add(cle);
    return async () => void enMemoire().delete(cle);
  }
  const { url } = await put(`${PREFIXE}${cle}`, "1", { access: "public", contentType: "text/plain", addRandomSuffix: true });
  return () => del(url);
}
