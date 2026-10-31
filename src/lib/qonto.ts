import { site } from "@/config/site";
import { DELAI_RETRACTATION_JOURS, mentionFacturation, SIGNATURE, type Commande, type Coordonnees } from "@/lib/commande";

/**
 * Appels à l'API Qonto pour la commande en ligne : création du client, du
 * devis et du mandat SEPA, puis lecture du mandat (signé ou non).
 *
 * Authentification par clé API (« identifiant:clé secrète »), acceptée par ces
 * routes. Si QONTO_STAGING_TOKEN est défini, les appels vont à la banque de
 * test (sandbox) ; sinon à la vraie banque. Rien n'est encaissé ici : les
 * factures, réglées par prélèvement, sont lancées à la main dans Qonto.
 */

const BASE_PRODUCTION = "https://thirdparty.qonto.com";
const BASE_SANDBOX = "https://thirdparty-sandbox.staging.qonto.co";

export interface ConfigQonto {
  base: string;
  headers: Record<string, string>;
}

type Env = Partial<Record<"QONTO_LOGIN" | "QONTO_SECRET_KEY" | "QONTO_STAGING_TOKEN" | "QONTO_API_BASE", string>> &
  Record<string, string | undefined>;

/**
 * Configuration lue dans l'environnement ; null tant que la clé API n'est pas
 * renseignée. QONTO_API_BASE ne sert qu'aux essais locaux (fausse banque) et
 * n'est défini ni en preview ni en production.
 */
export function configQonto(env: Env = process.env): ConfigQonto | null {
  const { QONTO_LOGIN: login, QONTO_SECRET_KEY: cle, QONTO_STAGING_TOKEN: jetonTest, QONTO_API_BASE: baseLocale } = env;
  if (!login || !cle) return null;
  const headers: Record<string, string> = { Authorization: `${login}:${cle}` };
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

export function corpsDevis(clientId: string, commande: Commande, aujourdhui: string) {
  const { coordonnees: c, echeancier, panier } = commande;
  const reference = c.referenceCadastrale ? `, référence cadastrale ${c.referenceCadastrale}` : "";
  return {
    client_id: clientId,
    issue_date: aujourdhui,
    expiry_date: ajouterJours(aujourdhui, SIGNATURE.validiteJours),
    currency: "EUR",
    header: `Permis de construire. Terrain : ${c.terrainAdresse}, ${c.terrainCodePostal} ${c.terrainCommune}${reference}. Surface de plancher prévue : ${c.surface} m².`,
    footer: mentionFacturation(echeancier),
    terms_and_conditions: conditionsDevis(),
    // Une ligne par prestation, quantité 1 au total de la ligne : le TTC de chaque ligne retombe ainsi au centime près.
    items: panier.lignes.map((l) => ({
      title: l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle,
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

/** Crée chez Qonto le client, son devis et son mandat SEPA (non signé). */
export async function creerCommandeQonto(cfg: ConfigQonto, commande: Commande, aujourdhui: string, f: typeof fetch = fetch): Promise<CommandeQonto> {
  const { client } = await appel<{ client: { id: string } }>(cfg, "POST", "/v2/clients", corpsClient(commande.coordonnees), f);
  const { quote } = await appel<{ quote: { id: string } }>(cfg, "POST", "/v2/quotes", corpsDevis(client.id, commande, aujourdhui), f);
  const { direct_debit_mandate: mandat } = await appel<{ direct_debit_mandate: { id: string; sign_url?: string } }>(
    cfg,
    "POST",
    "/v2/sepa/direct_debit_mandates",
    corpsMandat(client.id),
    f,
  );
  if (!mandat.sign_url) throw new ErreurQonto("Qonto : mandat créé sans page de signature", 502, "");
  return { clientId: client.id, devisId: quote.id, mandatId: mandat.id, urlMandat: mandat.sign_url };
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

export interface Devis {
  numero: string;
  /** Page publique Qonto du devis (consultation et PDF). */
  url: string;
}

export async function lireDevis(cfg: ConfigQonto, devisId: string, f: typeof fetch = fetch): Promise<Devis> {
  const { quote } = await appel<{ quote: { number: string; quote_url: string } }>(cfg, "GET", `/v2/quotes/${encodeURIComponent(devisId)}`, undefined, f);
  return { numero: quote.number, url: quote.quote_url };
}
