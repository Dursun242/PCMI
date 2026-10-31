import { site } from "@/config/site";
import { DELAI_RETRACTATION_JOURS, formulesCommande, mentionFacturation, SIGNATURE, type Commande, type Coordonnees } from "@/lib/commande";

/**
 * Appels à l'API Qonto pour la commande en ligne : création du client, du
 * devis et du mandat SEPA, puis lecture du mandat (signé ou non).
 *
 * Authentification OAuth (jeton d'accès Bearer) : la clé API ne permet pas
 * de créer un mandat. Rien n'est encaissé ici : les factures, réglées par
 * prélèvement, sont lancées à la main dans Qonto.
 */

const BASE_PRODUCTION = "https://thirdparty.qonto.com";
const BASE_SANDBOX = "https://thirdparty-sandbox.staging.qonto.co";

export interface ConfigQonto {
  base: string;
  headers: Record<string, string>;
}

type Env = Record<string, string | undefined>;

/**
 * Configuration d'appel à partir d'un jeton d'accès OAuth (voir
 * qontoConnexion.ts) : Qonto exige OAuth pour les mandats SEPA. Si
 * QONTO_STAGING_TOKEN est défini, les appels vont à la banque de test ;
 * QONTO_API_BASE ne sert qu'aux essais locaux (fausse banque).
 */
export function configQonto(jetonAcces: string, env: Env = process.env): ConfigQonto {
  const { QONTO_STAGING_TOKEN: jetonTest, QONTO_API_BASE: baseLocale } = env;
  const headers: Record<string, string> = { Authorization: `Bearer ${jetonAcces}` };
  if (jetonTest) headers["X-Qonto-Staging-Token"] = jetonTest;
  return { base: baseLocale || (jetonTest ? BASE_SANDBOX : BASE_PRODUCTION), headers };
}

/** Refus de Qonto. Le détail de la réponse reste dans les journaux du serveur, jamais chez le client. */
export class ErreurQonto extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
    this.name = "ErreurQonto";
  }
}

async function appel<T>(cfg: ConfigQonto, method: "GET" | "POST", chemin: string, corps: unknown, f: typeof fetch): Promise<T> {
  const res = await f(`${cfg.base}${chemin}`, {
    method,
    headers: { ...cfg.headers, Accept: "application/json", ...(corps ? { "Content-Type": "application/json" } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
    cache: "no-store",
  });
  const texte = await res.text();
  if (!res.ok) throw new ErreurQonto(`Qonto ${method} ${chemin} : ${res.status}`, res.status, texte.slice(0, 1000));
  return JSON.parse(texte) as T;
}

/** « 06 12 34 56 78 » → { +33, 612345678 } ; tout autre format est omis (le champ est facultatif). */
function telephoneQonto(telephone: string): { country_code: string; number: string } | undefined {
  const chiffres = telephone.replace(/\D/g, "").replace(/^33(?=\d{9}$)/, "0");
  return /^0\d{9}$/.test(chiffres) ? { country_code: "+33", number: chiffres.slice(1) } : undefined;
}

export function corpsClient(c: Coordonnees) {
  return {
    kind: "individual",
    first_name: c.prenom,
    last_name: c.nom,
    email: c.email,
    phone: telephoneQonto(c.telephone),
    currency: "EUR",
    locale: "fr",
    billing_address: { street_address: c.adresse, city: c.ville, zip_code: c.codePostal, country_code: "FR" },
  };
}

const TVA = 0.2;
/** HT arrondi au centime dont le TTC (×1,2) retombe sur le prix affiché. */
const ht = (ttc: number) => (Math.round((ttc * 100) / (1 + TVA)) / 100).toFixed(2);

const ajouterJours = (jour: string, n: number) => {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Conditions imprimées sur le devis : l'essentiel, et le renvoi vers les CGV complètes signées avec lui. */
function conditionsDevis(): string {
  return [
    `Commande soumise aux conditions générales de vente de ${site.legal.company}, consultables sur ${site.url}/cgv et acceptées par le client lors de la signature électronique de ce devis.`,
    `Le contrat est formé à cette signature. ${site.legal.company} vérifie ensuite, à la lecture du règlement d'urbanisme applicable, que le permis peut être déposé ; si ce n'est pas le cas, la commande est annulée sans frais : aucune facture n'est émise et aucun prélèvement n'est effectué.`,
    `Droit de rétractation de ${DELAI_RETRACTATION_JOURS} jours à compter de la signature (code de la consommation, art. L221-18), formulaire type dans les CGV.`,
    "Règlement par prélèvement SEPA sur le mandat signé par le client. Les plans et documents sont cédés au client à l'achèvement du paiement intégral.",
  ].join("\n");
}

/** Détail de la ligne du permis : le terrain et la surface, une information par ligne. */
function detailTerrain(c: Coordonnees): string {
  return [
    `Terrain : ${c.terrainAdresse}, ${c.terrainCodePostal} ${c.terrainCommune}`,
    c.referenceCadastrale ? `Référence cadastrale : ${c.referenceCadastrale}` : "",
    `Surface de plancher prévue : ${c.surface} m²`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function corpsDevis(clientId: string, commande: Commande, aujourdhui: string) {
  const { coordonnees: c, echeancier, panier } = commande;
  const formule = formulesCommande.find((f) => f.id === panier.formule)?.name ?? panier.formule;
  return {
    client_id: clientId,
    issue_date: aujourdhui,
    expiry_date: ajouterJours(aujourdhui, SIGNATURE.validiteJours),
    currency: "EUR",
    footer: mentionFacturation(echeancier),
    terms_and_conditions: conditionsDevis(),
    // Une ligne par prestation, quantité 1 au total de la ligne : le TTC de chaque ligne retombe ainsi au centime près.
    // La première est le permis lui-même, avec le terrain en détail ; les suivantes, les options.
    items: panier.lignes.map((l, i) => ({
      title: i === 0 ? `Permis de construire ${formule}` : l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle,
      ...(i === 0 ? { description: detailTerrain(c) } : {}),
      quantity: "1",
      unit_price: { value: ht(l.totalTTC), currency: "EUR" },
      vat_rate: String(TVA),
      currency: "EUR",
    })),
  };
}

export function corpsMandat(clientId: string) {
  return { direct_debit_mandate: { client_id: clientId, send_mandate_signature_email: false } };
}

export interface CommandeQonto {
  clientId: string;
  devisId: string;
  mandatId: string;
  /** Page sécurisée Qonto où le client saisit son IBAN et signe le mandat. */
  urlMandat: string;
}

/** Client existant pour cet e-mail (nouvel essai, deuxième commande) : réutilisé plutôt que dupliqué. */
async function clientExistant(cfg: ConfigQonto, email: string, f: typeof fetch): Promise<string | null> {
  const { clients } = await appel<{ clients: { id: string; email?: string }[] }>(
    cfg,
    "GET",
    `/v2/clients?${new URLSearchParams({ "filter[email]": email })}`,
    undefined,
    f,
  );
  return clients.find((c) => c.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

/**
 * Crée chez Qonto le client (ou reprend celui qui existe), son mandat SEPA
 * (non signé) puis son devis. Le devis vient en dernier : si le mandat est
 * refusé, aucun numéro de devis n'est consommé.
 */
export async function creerCommandeQonto(cfg: ConfigQonto, commande: Commande, aujourdhui: string, f: typeof fetch = fetch): Promise<CommandeQonto> {
  const clientId =
    (await clientExistant(cfg, commande.coordonnees.email, f)) ??
    (await appel<{ client: { id: string } }>(cfg, "POST", "/v2/clients", corpsClient(commande.coordonnees), f)).client.id;
  const { direct_debit_mandate: mandat } = await appel<{ direct_debit_mandate: { id: string; sign_url?: string } }>(
    cfg,
    "POST",
    "/v2/sepa/direct_debit_mandates",
    corpsMandat(clientId),
    f,
  );
  if (!mandat.sign_url) throw new ErreurQonto("Qonto : mandat créé sans page de signature", 502, "");
  const { quote } = await appel<{ quote: { id: string } }>(cfg, "POST", "/v2/quotes", corpsDevis(clientId, commande, aujourdhui), f);
  return { clientId, devisId: quote.id, mandatId: mandat.id, urlMandat: mandat.sign_url };
}

/** IBAN réduit à ses quatre derniers caractères : le seul affichage autorisé côté site. */
export function masquerIban(iban: string | undefined): string {
  return iban ? `•••• ${iban.replace(/\s/g, "").slice(-4)}` : "";
}

export interface EtatMandat {
  signe: boolean;
  iban: string;
  reference: string;
  /** Page de signature, tant que le mandat attend la signature. */
  urlSignature?: string;
}

export async function lireMandat(cfg: ConfigQonto, mandatId: string, f: typeof fetch = fetch): Promise<EtatMandat> {
  const { direct_debit_mandate: m } = await appel<{
    direct_debit_mandate: { status: string; iban?: string; unique_mandate_reference: string; sign_url?: string };
  }>(cfg, "GET", `/v2/sepa/direct_debit_mandates/${encodeURIComponent(mandatId)}`, undefined, f);
  return { signe: m.status === "approved", iban: masquerIban(m.iban), reference: m.unique_mandate_reference, urlSignature: m.sign_url };
}

export interface LigneDevis {
  titre: string;
  description?: string;
  quantite: number;
  prixUnitaireHT: number;
  /** Taux de TVA en décimal (0,2 pour 20 %). */
  tauxTVA: number;
  totalHT: number;
}

export interface PartieDevis {
  nom: string;
  adresse: string;
  /** Code postal et ville. */
  ville: string;
}

export interface Devis {
  numero: string;
  /** Page publique Qonto du devis (consultation et PDF). */
  url: string;
  dateEmission: string;
  dateExpiration: string;
  lignes: LigneDevis[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  /** Pied du devis : la mention de facturation. */
  pied: string;
  conditions: string;
  emetteur: PartieDevis & { siret: string };
  client: PartieDevis & { email: string };
  /** Pièce jointe Qonto portant le PDF du devis. */
  pieceJointeId?: string;
}

type Montant = { value: string } | undefined;
interface DevisQonto {
  number: string;
  attachment_id?: string;
  quote_url: string;
  issue_date: string;
  expiry_date: string;
  footer?: string;
  terms_and_conditions?: string;
  total_amount: Montant;
  vat_amount: Montant;
  items?: { title: string; description?: string; quantity: string; unit_price: Montant; vat_rate: string; subtotal: Montant }[];
  client?: { name?: string; address?: string; zip_code?: string; city?: string; email?: string };
  organization?: { legal_name?: string; address_line_1?: string; address_zipcode?: string; address_city?: string; legal_number?: string };
}

const nombre = (m: Montant | string | undefined) => Number(typeof m === "string" ? m : (m?.value ?? 0));
const ville = (codePostal?: string, nom?: string) => [codePostal, nom].filter(Boolean).join(" ");

/** Le devis tel que Qonto l'a établi : de quoi en montrer un fidèle aperçu au client avant la signature. */
export async function lireDevis(cfg: ConfigQonto, devisId: string, f: typeof fetch = fetch): Promise<Devis> {
  const { quote: q } = await appel<{ quote: DevisQonto }>(cfg, "GET", `/v2/quotes/${encodeURIComponent(devisId)}`, undefined, f);
  const totalTTC = nombre(q.total_amount);
  const totalTVA = nombre(q.vat_amount);
  return {
    numero: q.number,
    url: q.quote_url,
    dateEmission: q.issue_date,
    dateExpiration: q.expiry_date,
    lignes: (q.items ?? []).map((i) => ({
      titre: i.title,
      ...(i.description ? { description: i.description } : {}),
      quantite: nombre(i.quantity),
      prixUnitaireHT: nombre(i.unit_price),
      tauxTVA: nombre(i.vat_rate),
      totalHT: nombre(i.subtotal),
    })),
    totalHT: Math.round((totalTTC - totalTVA) * 100) / 100,
    totalTVA,
    totalTTC,
    pied: q.footer ?? "",
    conditions: q.terms_and_conditions ?? "",
    emetteur: {
      nom: q.organization?.legal_name ?? "",
      adresse: q.organization?.address_line_1 ?? "",
      ville: ville(q.organization?.address_zipcode, q.organization?.address_city),
      siret: q.organization?.legal_number ?? "",
    },
    client: {
      nom: q.client?.name ?? "",
      adresse: q.client?.address ?? "",
      ville: ville(q.client?.zip_code, q.client?.city),
      email: q.client?.email ?? "",
    },
    ...(q.attachment_id ? { pieceJointeId: q.attachment_id } : {}),
  };
}

export interface PdfDevis {
  nomFichier: string;
  contenu: Buffer;
}

/**
 * PDF du devis, pour le joindre aux e-mails de confirmation. Qonto le sert
 * par un lien temporaire (droit attachment.read). En cas d'échec, null :
 * l'e-mail part alors avec le lien vers le devis, la signature n'échoue pas.
 */
export async function pdfDevis(cfg: ConfigQonto, pieceJointeId: string | undefined, f: typeof fetch = fetch): Promise<PdfDevis | null> {
  if (!pieceJointeId) return null;
  try {
    const { attachment } = await appel<{ attachment: { file_name: string; url: string } }>(
      cfg,
      "GET",
      `/v2/attachments/${encodeURIComponent(pieceJointeId)}`,
      undefined,
      f,
    );
    const res = await f(attachment.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`téléchargement du PDF : ${res.status}`);
    return { nomFichier: attachment.file_name, contenu: Buffer.from(await res.arrayBuffer()) };
  } catch (err) {
    console.error("[qonto] PDF du devis indisponible", err instanceof ErreurQonto ? `${err.message} ${err.detail}` : err);
    return null;
  }
}
