import "server-only";
import { AwsClient } from "aws4fetch";
import { site } from "@/config/site";

/**
 * Fichiers du site dans Cloudflare R2 (compartiment privé « permis-site-fichiers », 06/11/2026) : PDF et aperçus des
 * DP piscine, photos et pièces envoyées par les clients. Vercel Blob gratuit est limité à 2 000 écritures sur 30
 * jours glissants ; R2 gratuit : 10 Go, 1 million d'écritures par mois, téléchargements non comptés.
 *
 * Accès S3 signé (jeton R2 « lecture et écriture d'objets » limité au compartiment) : CLOUDFLARE_ACCOUNT_ID,
 * R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET. Sans elles, chaque appelant garde Vercel Blob.
 *
 * Le compartiment n'est pas public : les fichiers sont servis par le site, /api/fichiers/<chemin>, avec un long cache
 * du CDN (chemins uniques, jamais réécrits). Comme avant, l'adresse d'un fichier payant est longue et aléatoire.
 */

type Env = Record<string, string | undefined>;

export const PREFIXE_URL = "/api/fichiers/";

export function r2Configure(env: Env = process.env): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}

function client(env: Env = process.env) {
  const aws = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
  const base = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/`;
  return { aws, url: (chemin: string) => base + chemin.split("/").map(encodeURIComponent).join("/") };
}

/** Chemin accepté : lettres, chiffres, « - _ . / », sans « .. » ni « / » en tête. */
export function cheminValide(chemin: string): boolean {
  return /^[\w][\w\-./]{0,300}$/.test(chemin) && !chemin.includes("..") && !chemin.includes("//");
}

/** Adresse publique d'un fichier, servie par le site. */
export const urlFichier = (chemin: string) => `${site.url}${PREFIXE_URL}${chemin}`;

export async function r2Ecrire(chemin: string, contenu: Buffer | Uint8Array, type: string): Promise<string> {
  if (!cheminValide(chemin)) throw new Error(`R2 : chemin refusé (${chemin})`);
  const { aws, url } = client();
  const r = await aws.fetch(url(chemin), { method: "PUT", body: new Uint8Array(contenu), headers: { "Content-Type": type } });
  if (!r.ok) throw new Error(`R2 : écriture ${r.status} sur ${chemin}`);
  return urlFichier(chemin);
}

/** Le fichier tel que R2 le renvoie (corps et type), ou null s'il n'existe pas. */
export async function r2Lire(chemin: string): Promise<Response | null> {
  if (!cheminValide(chemin)) return null;
  const { aws, url } = client();
  const r = await aws.fetch(url(chemin), { method: "GET" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`R2 : lecture ${r.status} sur ${chemin}`);
  return r;
}

/**
 * Adresse d'envoi direct navigateur → R2, valable `secondes` : le type du fichier est signé (le navigateur doit
 * l'envoyer tel quel). Renvoie aussi l'adresse publique du fichier une fois envoyé.
 */
export async function r2AdresseEnvoi(chemin: string, type: string, secondes = 600): Promise<{ envoi: string; url: string }> {
  if (!cheminValide(chemin)) throw new Error(`R2 : chemin refusé (${chemin})`);
  const { aws, url } = client();
  const cible = new URL(url(chemin));
  cible.searchParams.set("X-Amz-Expires", String(secondes));
  const signe = await aws.sign(new Request(cible, { method: "PUT", headers: { "Content-Type": type } }), {
    aws: { signQuery: true, allHeaders: true },
  });
  return { envoi: signe.url, url: urlFichier(chemin) };
}
