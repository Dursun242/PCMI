import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secrets de la planche gratuite : empreinte de la parcelle (le registre ne
 * contient aucune référence lisible), signature de l'adresse de rappel donnée
 * à GitHub, et chiffrement des coordonnées du visiteur dans le registre.
 *
 * Clé : PLANCHE_SECRET, à défaut ADMIN_SESSION_SECRET (déjà posé pour /admin).
 */

/** Durée de validité de l'adresse de rappel : une planche se dessine en 1 à 2 minutes. */
export const VALIDITE_RAPPEL_MS = 60 * 60 * 1000;

export function secretPlanche(): string | null {
  return process.env.PLANCHE_SECRET || process.env.ADMIN_SESSION_SECRET || null;
}

function cle(secret: string, usage: string): Buffer {
  return createHash("sha256").update(`${usage}:${secret}`).digest();
}

/**
 * Ancienne empreinte, de la parcelle seule : c'est sous ce nom que sont
 * rangées les demandes faites avant la règle « par terrain et par personne ».
 * Elle ne sert plus qu'à les relire (memeDemandeur).
 */
export function empreinteParcelle(idu: string, secret: string): string {
  return createHmac("sha256", cle(secret, "parcelle")).update(idu.toUpperCase()).digest("hex").slice(0, 40);
}

const normaliserEmail = (email: string) => email.trim().toLowerCase();

/**
 * Empreinte d'une demande : une parcelle et une adresse e-mail. Une même
 * personne n'a droit qu'à une planche par parcelle (situation, masse ou
 * coupes, au choix), mais peut en demander une pour un autre terrain, et une
 * autre personne peut demander la même parcelle.
 */
export function empreinteDemande(idu: string, email: string, secret: string): string {
  return createHmac("sha256", cle(secret, "demande"))
    .update(`${idu.toUpperCase()}|${normaliserEmail(email)}`)
    .digest("hex")
    .slice(0, 40);
}

/** Vrai si les coordonnées chiffrées d'une demande enregistrée portent cette adresse e-mail. */
export function memeDemandeur(contactChiffre: string | null, email: string, secret: string): boolean {
  const texte = contactChiffre ? dechiffrer(contactChiffre, secret) : null;
  if (!texte) return false;
  try {
    const contact = JSON.parse(texte) as { email?: unknown };
    return typeof contact.email === "string" && normaliserEmail(contact.email) === normaliserEmail(email);
  } catch {
    return false;
  }
}

const charge = (id: string, empreinte: string, expire: number) => `${id}.${empreinte}.${expire}`;

export function signerRappel(id: string, empreinte: string, expire: number, secret: string): string {
  return createHmac("sha256", cle(secret, "rappel")).update(charge(id, empreinte, expire)).digest("hex");
}

/** Vrai si la signature correspond et que l'adresse n'a pas expiré. */
export function verifierRappel(
  p: { id: string; empreinte: string; expire: number; signature: string },
  secret: string,
  maintenant = Date.now(),
): boolean {
  if (!Number.isFinite(p.expire) || p.expire < maintenant) return false;
  const attendue = Buffer.from(signerRappel(p.id, p.empreinte, p.expire, secret), "hex");
  const recue = Buffer.from(/^[0-9a-f]{64}$/.test(p.signature) ? p.signature : "", "hex");
  return recue.length === attendue.length && timingSafeEqual(recue, attendue);
}

/** Chiffre un texte (AES-256-GCM) : « iv.tag.données », en base64url. */
export function chiffrer(texte: string, secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(secret, "contact"), iv);
  const donnees = Buffer.concat([c.update(texte, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), donnees].map((b) => b.toString("base64url")).join(".");
}

/** Déchiffre ; null si le texte a été altéré ou chiffré avec une autre clé. */
export function dechiffrer(chiffre: string, secret: string): string | null {
  try {
    const [iv, tag, donnees] = chiffre.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", cle(secret, "contact"), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(donnees), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
