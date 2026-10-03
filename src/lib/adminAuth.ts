/**
 * Authentification très simple pour l'espace /admin : un seul mot de passe
 * partagé (ADMIN_PASSWORD), un cookie de session signé par HMAC. Pas de
 * base de données, pas de dépendance : uniquement l'API Web Crypto,
 * disponible aussi bien en runtime Node (routes API) qu'en Edge (middleware).
 */
export const ADMIN_COOKIE_NAME = "pcmi_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 h
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function bytesToBase64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const str = atob(padded);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

function getPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

/**
 * Clé de signature du cookie. ADMIN_SESSION_SECRET (longue chaîne aléatoire)
 * est préférable : si un cookie fuit, un mot de passe court pourrait sinon
 * être retrouvé hors ligne à partir de sa signature. Repli sur le mot de passe
 * pour ne pas casser une installation existante.
 */
function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length > 0 ? secret : getPassword();
}

export function isAdminConfigured(): boolean {
  return getPassword() !== null;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256B64(value: string): Promise<string> {
  return bytesToBase64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Compare les empreintes (longueur fixe) : ne révèle pas la longueur du mot de passe. */
export async function checkPassword(candidate: string): Promise<boolean> {
  const password = getPassword();
  if (!password) return false;
  return timingSafeEqual(await sha256B64(candidate), await sha256B64(password));
}

/**
 * Destination après connexion (paramètre ?next=) : uniquement un chemin de
 * l'espace admin, jamais une autre origine (//site, https://, \) — sinon la
 * page de connexion servirait de redirection ouverte pour du phishing.
 */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || !/^\/admin(?:[/?#]|$)/.test(next) || next.includes("\\") || next.includes("..")) return "/admin";
  return next;
}

export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD non configuré");
  const payloadB64 = bytesToBase64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })));
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${bytesToBase64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;
  try {
    const key = await getHmacKey(secret);
    const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
    if (!timingSafeEqual(bytesToBase64url(expectedSig), sigB64)) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
