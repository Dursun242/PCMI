/**
 * Côté navigateur : envoie un événement au compteur de /permis-express.
 * Ne fait rien ailleurs sur le site, ce qui permet de l'appeler depuis des
 * composants partagés (lien téléphone, lien WhatsApp).
 */
import type { Bilan, EtatVideo } from "./bilan";
import type { GenreSuite } from "./suite";
import type { TypeSuivi } from "./suivi";

const CLE_ADS = "pcmi_express_ads";

/** La visite vient-elle d'une annonce ? Mémorisé pour la session : le gclid peut disparaître de l'URL. */
export function visiteAds(): boolean {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gclid") || p.get("utm_source") === "google") sessionStorage.setItem(CLE_ADS, "1");
    return sessionStorage.getItem(CLE_ADS) === "1";
  } catch {
    return false;
  }
}

export function suivreExpress(type: "vue" | "formulaire" | "appel" | "whatsapp") {
  if (window.location.pathname !== "/permis-express") return;
  envoyer(type);
}

/**
 * Bilan de la visite, envoyé par ExpressVue au départ. Sans contrôle de
 * l'adresse : après l'envoi du formulaire, elle est déjà celle de la page merci.
 */
export function envoyerBilan(bilan: Bilan) {
  envoyer("bilan", { bilan });
}

/** Formulaire envoyé pendant cette visite : le bilan ne le compte pas comme abandonné. */
let formulaireEnvoye = false;
export const noterEnvoi = () => {
  formulaireEnvoye = true;
};
export const formulaireAEteEnvoye = () => formulaireEnvoye;

/** Ce que le visiteur a fait de la vidéo du déroulé pendant cette visite (lue par ExpressVue). */
const video = new Set<EtatVideo>();
export const noterVideo = (etat: EtatVideo) => {
  video.add(etat);
};
export const etatsVideo = (): EtatVideo[] => [...video];

const CLE_SUITE = "pcmi_express_suite";
const CLE_SUITE_VUS = "pcmi_express_suite_vus";
/** Plafond d'événements de suite par visite : une visite normale en envoie quelques-uns. */
const SUITE_MAX = 25;

/** Le visiteur quitte la page Express pour une autre page du site : sa suite de parcours sera mesurée. */
export function marquerSuite() {
  try {
    sessionStorage.setItem(CLE_SUITE, "1");
  } catch {
    /* stockage indisponible : pas de suite mesurée */
  }
}

/**
 * Page vue ou contact pris ailleurs sur le site, après la page Express.
 * Seulement pour un visiteur parti de la page Express dans cet onglet, et une
 * fois par page ou par contact : un rechargement ne recompte pas.
 */
export function suivreSuite(genre: GenreSuite, valeur: string | null) {
  if (!valeur) return;
  try {
    if (sessionStorage.getItem(CLE_SUITE) !== "1" || window.location.pathname === "/permis-express") return;
    const vus = JSON.parse(sessionStorage.getItem(CLE_SUITE_VUS) ?? "[]") as string[];
    const cle = `${genre}.${valeur}`;
    if (vus.includes(cle) || vus.length >= SUITE_MAX) return;
    sessionStorage.setItem(CLE_SUITE_VUS, JSON.stringify([...vus, cle]));
  } catch {
    return;
  }
  envoyer("suite", { suite: { genre, valeur } });
}

/**
 * Vues, bilans de visite et suites du parcours : envoyés à Umami (depuis le 06/11/2026) ET au compteur Express,
 * qui les enregistre dans Cloudflare D1 (06/11/2026 au soir). Le serveur les ignore tant que D1 n'est pas
 * configuré : dans Vercel Blob, deux fichiers par visiteur avaient consommé 75 % du quota du mois.
 */
const VERS_UMAMI = new Set<string>(["vue", "bilan", "suite"]);

function versUmami(type: TypeSuivi, extra: Record<string, unknown>) {
  const b = extra.bilan as Bilan | undefined;
  const s = extra.suite as { genre?: string; valeur?: string } | undefined;
  const donnees: Record<string, string> = { ads: visiteAds() ? "oui" : "non" };
  if (b) Object.assign(donnees, { temps: String(b.temps), appareil: String(b.appareil), envoye: b.envoye ? "oui" : "non", abandon: b.abandon ?? "" });
  if (s) Object.assign(donnees, { genre: String(s.genre ?? ""), valeur: String(s.valeur ?? "").slice(0, 60) });
  try {
    window.umami?.track(`express_${type}`, donnees);
  } catch {
    /* script bloqué : rien */
  }
}

function envoyer(type: TypeSuivi, extra: Record<string, unknown> = {}) {
  if (VERS_UMAMI.has(type)) versUmami(type, extra);
  try {
    const corps = JSON.stringify({ type, ads: visiteAds(), ...extra });
    // sendBeacon survit à l'ouverture de l'appli Téléphone ou WhatsApp, contrairement à fetch.
    if (!navigator.sendBeacon?.("/api/express/suivi", corps)) {
      // Réseau coupé ou bloqueur : la promesse rejetée ne doit pas finir en erreur dans la console.
      fetch("/api/express/suivi", { method: "POST", body: corps, keepalive: true }).catch(() => {});
    }
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}
