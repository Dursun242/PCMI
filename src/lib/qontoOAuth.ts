import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Connexion OAuth 2.0 à Qonto, exigée pour créer les mandats SEPA.
 *
 * L'administrateur autorise une fois le site depuis /admin ; le site garde
 * ensuite le jeton d'accès (valable 1 heure) et le jeton de renouvellement
 * (90 jours, à usage unique : chaque renouvellement en donne un nouveau, qu'il
 * faut enregistrer aussitôt). Le stockage est injecté, ce qui garde cette
 * logique testable sans réseau.
 */

/** Droits demandés : clients, devis, mandats SEPA, et l'accès hors ligne (jeton de renouvellement). */
export const SCOPES_QONTO = [
  "offline_access",
  "client.read",
  "client.write",
  "client_invoices.read",
  "client_invoice.write",
  "sepa_direct_debit.read",
  "sepa_direct_debit.write",
] as const;

export interface ConfigOAuth {
  clientId: string;
  clientSecret: string;
  urlAuth: string;
  urlJeton: string;
}

export interface Jetons {
  acces: string;
  renouvellement: string;
  /** Expiration du jeton d'accès, en millisecondes depuis 1970. */
  expireA: number;
}

export interface StockageJetons {
  lire(): Promise<Jetons | null>;
  ecrire(jetons: Jetons): Promise<void>;
}

/** Connexion absente, refusée ou expirée : l'administrateur doit recliquer « Connecter Qonto ». */
export class ErreurConnexionQonto extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurConnexionQonto";
  }
}

const BASE_OAUTH = "https://oauth.qonto.com";

/** Cookie anti-CSRF (state) du parcours d'autorisation, posé par /api/admin/qonto/connexion. */
export const COOKIE_ETAT_QONTO = "pcmi_qonto_etat";

type Env = Record<string, string | undefined>;

/** Configuration OAuth ; null tant que l'application Qonto n'est pas renseignée. QONTO_OAUTH_BASE ne sert qu'aux essais locaux. */
export function configOAuth(env: Env = process.env): ConfigOAuth | null {
  const { QONTO_CLIENT_ID: clientId, QONTO_CLIENT_SECRET: clientSecret } = env;
  if (!clientId || !clientSecret) return null;
  const base = env.QONTO_OAUTH_BASE || BASE_OAUTH;
  return { clientId, clientSecret, urlAuth: `${base}/oauth2/auth`, urlJeton: `${base}/oauth2/token` };
}

export function urlAutorisation(cfg: ConfigOAuth, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES_QONTO.join(" "),
    state,
  });
  return `${cfg.urlAuth}?${params}`;
}

/** Marge avant expiration : un jeton qui expire dans moins de 2 minutes est renouvelé d'avance. */
const MARGE_MS = 2 * 60 * 1000;

async function demanderJetons(cfg: ConfigOAuth, champs: Record<string, string>, f: typeof fetch, maintenant: number): Promise<Jetons> {
  // Identifiants dans le corps du formulaire : Qonto refuse l'en-tête Authorization: Basic.
  const res = await f(cfg.urlJeton, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ ...champs, client_id: cfg.clientId, client_secret: cfg.clientSecret }).toString(),
    cache: "no-store",
  });
  const texte = await res.text();
  if (!res.ok) throw new ErreurConnexionQonto(`Qonto OAuth : ${res.status} ${texte.slice(0, 300)}`);
  const json = JSON.parse(texte) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!json.access_token || !json.refresh_token) {
    throw new ErreurConnexionQonto("Qonto OAuth : réponse sans jeton de renouvellement (droit offline_access manquant ?)");
  }
  return { acces: json.access_token, renouvellement: json.refresh_token, expireA: maintenant + (json.expires_in ?? 3600) * 1000 };
}

export function echangerCode(cfg: ConfigOAuth, code: string, redirectUri: string, f: typeof fetch = fetch, maintenant = Date.now()): Promise<Jetons> {
  return demanderJetons(cfg, { grant_type: "authorization_code", code, redirect_uri: redirectUri }, f, maintenant);
}

/**
 * Jeton d'accès valable, renouvelé si besoin. Si le renouvellement est refusé
 * parce qu'une autre instance du site vient de renouveler (jeton à usage
 * unique déjà consommé), on relit le stockage et on reprend son jeton.
 */
export async function jetonAcces(cfg: ConfigOAuth, stockage: StockageJetons, f: typeof fetch = fetch, maintenant = Date.now()): Promise<string> {
  const jetons = await stockage.lire();
  if (!jetons) throw new ErreurConnexionQonto("Qonto n'est pas connecté : cliquez sur « Connecter Qonto » dans l'espace admin.");
  if (jetons.expireA - MARGE_MS > maintenant) return jetons.acces;

  try {
    const neufs = await demanderJetons(cfg, { grant_type: "refresh_token", refresh_token: jetons.renouvellement }, f, maintenant);
    await stockage.ecrire(neufs);
    return neufs.acces;
  } catch (err) {
    const relus = await stockage.lire();
    if (relus && relus.renouvellement !== jetons.renouvellement && relus.expireA - MARGE_MS > maintenant) return relus.acces;
    throw err instanceof ErreurConnexionQonto ? err : new ErreurConnexionQonto(String(err));
  }
}

/* ---------- Chiffrement des jetons au repos (AES-256-GCM) ---------- */

const cleChiffrement = (secret: string) => createHash("sha256").update(`pcmi-qonto-jetons:${secret}`).digest();

export function chiffrer(texte: string, secret: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cleChiffrement(secret), iv);
  const contenu = Buffer.concat([chiffreur.update(texte, "utf8"), chiffreur.final()]);
  return [iv, chiffreur.getAuthTag(), contenu].map((b) => b.toString("base64url")).join(".");
}

/** Texte déchiffré, ou null si la boîte est illisible ou la clé mauvaise. */
export function dechiffrer(boite: string, secret: string): string | null {
  try {
    const [iv, etiquette, contenu] = boite.split(".").map((p) => Buffer.from(p, "base64url"));
    if (!iv || !etiquette || !contenu) return null;
    const dechiffreur = createDecipheriv("aes-256-gcm", cleChiffrement(secret), iv);
    dechiffreur.setAuthTag(etiquette);
    return Buffer.concat([dechiffreur.update(contenu), dechiffreur.final()]).toString("utf8");
  } catch {
    return null;
  }
}
