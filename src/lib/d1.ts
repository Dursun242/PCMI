import "server-only";

/**
 * Base Cloudflare D1 « permis-site » (06/11/2026) : les petites données du site (registre des planches gratuites,
 * dossiers DP piscine, compteurs, commandes finalisées, connexion Qonto) quittent Vercel Blob, limité à 2 000
 * écritures sur 30 jours glissants en offre gratuite. D1 gratuit : 100 000 écritures et 5 millions de lectures par
 * jour, 5 Go. Les fichiers (PDF, photos, aperçus) restent dans Blob.
 *
 * Accès par l'API REST de Cloudflare (jeton limité à D1 → Modifier) : CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_ID,
 * CLOUDFLARE_D1_TOKEN. Sans ces trois variables, chaque registre garde son ancien stockage : la bascule se fait en
 * posant les variables dans Vercel, sans redéploiement de code.
 *
 * Deux tables, sans schéma propre à chaque registre (les registres gardent leurs anciens chemins Blob comme clés,
 * d'où une recopie directe de l'existant) :
 *   documents(cle TEXT PRIMARY KEY, valeur TEXT, maj INTEGER) : un JSON par clé ;
 *   evenements(chemin TEXT PRIMARY KEY, instant INTEGER)       : un événement compté par ligne (chemin codé).
 */

type Env = Record<string, string | undefined>;
type Valeur = string | number | null;

export function d1Configure(env: Env = process.env): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_D1_ID && env.CLOUDFLARE_D1_TOKEN);
}

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS documents (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL, maj INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS documents_maj ON documents(maj)",
  "CREATE TABLE IF NOT EXISTS evenements (chemin TEXT PRIMARY KEY, instant INTEGER NOT NULL)",
];

interface Resultat {
  results: Record<string, unknown>[];
  meta?: { changes?: number };
}

async function appel(sql: string, params: Valeur[], env: Env): Promise<Resultat> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_ID}/query`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_D1_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
    cache: "no-store",
  });
  const json = (await r.json().catch(() => null)) as {
    success?: boolean;
    errors?: { message?: string }[];
    result?: Resultat[];
  } | null;
  if (!r.ok || !json?.success || !json.result?.[0]) {
    const detail = json?.errors?.map((e) => e.message).join(" ; ") || `HTTP ${r.status}`;
    throw new Error(`D1 : ${detail}`);
  }
  return json.result[0];
}

/** Une requête SQL ; les tables manquantes (base neuve) sont créées puis la requête rejouée. */
export async function requete(sql: string, params: Valeur[] = [], env: Env = process.env): Promise<Resultat> {
  try {
    return await appel(sql, params, env);
  } catch (err) {
    if (!/no such table/i.test(String(err))) throw err;
    for (const s of SCHEMA) await appel(s, [], env);
    return appel(sql, params, env);
  }
}

/** Bornes d'un préfixe pour une recherche par plage (sans LIKE, donc sans caractère à échapper). */
const plage = (prefixe: string): [string, string] => [prefixe, `${prefixe}￿`];

export async function docLire<T>(cle: string): Promise<T | null> {
  const { results } = await requete("SELECT valeur FROM documents WHERE cle = ?", [cle]);
  const v = results[0]?.valeur;
  return typeof v === "string" ? (JSON.parse(v) as T) : null;
}

export async function docEcrire(cle: string, valeur: unknown, maj = Date.now()): Promise<void> {
  await requete(
    "INSERT INTO documents (cle, valeur, maj) VALUES (?, ?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur, maj = excluded.maj",
    [cle, JSON.stringify(valeur), maj],
  );
}

/** Écrit seulement si la clé est libre ; vrai si l'écriture a eu lieu. */
export async function docCreerSiAbsent(cle: string, valeur: unknown): Promise<boolean> {
  const r = await requete("INSERT OR IGNORE INTO documents (cle, valeur, maj) VALUES (?, ?, ?)", [
    cle,
    JSON.stringify(valeur),
    Date.now(),
  ]);
  return (r.meta?.changes ?? 0) > 0;
}

export async function docSupprimer(cle: string): Promise<void> {
  await requete("DELETE FROM documents WHERE cle = ?", [cle]);
}

/** Documents dont la clé commence par `prefixe`, les plus récents d'abord. */
export async function docLister<T>(prefixe: string, max = 200): Promise<{ cle: string; valeur: T; maj: number }[]> {
  const { results } = await requete(
    "SELECT cle, valeur, maj FROM documents WHERE cle >= ? AND cle < ? ORDER BY maj DESC LIMIT ?",
    [...plage(prefixe), max],
  );
  return results.map((r) => ({ cle: String(r.cle), valeur: JSON.parse(String(r.valeur)) as T, maj: Number(r.maj) }));
}

export async function evtAjouter(chemin: string, instant = Date.now()): Promise<void> {
  await requete("INSERT OR IGNORE INTO evenements (chemin, instant) VALUES (?, ?)", [chemin, instant]);
}

/** Chemins des événements sous `prefixe` (au plus `max`) ; `tronque` si la limite est atteinte. */
export async function evtChemins(prefixe: string, max = 20_000): Promise<{ chemins: string[]; tronque: boolean }> {
  const { results } = await requete("SELECT chemin FROM evenements WHERE chemin >= ? AND chemin < ? LIMIT ?", [
    ...plage(prefixe),
    max + 1,
  ]);
  const chemins = results.map((r) => String(r.chemin));
  return { chemins: chemins.slice(0, max), tronque: chemins.length > max };
}

/** Plusieurs événements en une requête (D1 : 100 paramètres au plus par requête, soit 50 lignes). */
export async function evtAjouterLot(lignes: { chemin: string; instant: number }[]): Promise<void> {
  for (let i = 0; i < lignes.length; i += 50) {
    const lot = lignes.slice(i, i + 50);
    await requete(
      `INSERT OR IGNORE INTO evenements (chemin, instant) VALUES ${lot.map(() => "(?, ?)").join(", ")}`,
      lot.flatMap((l) => [l.chemin, l.instant]),
    );
  }
}
