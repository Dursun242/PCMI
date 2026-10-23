/**
 * Google Ads — suivi des conversions (compte 397-163-2258, campagne « PCMI Express »).
 *
 * Contrairement à Vercel Analytics et Umami, la balise Google peut déposer des
 * cookies publicitaires : elle tourne en Consent Mode v2, refus par défaut, et
 * ne passe en « granted » qu'après accord explicite dans la bannière
 * (components/GoogleAds.tsx). Refus = pings sans cookie, conversions modélisées.
 * Aucune donnée personnelle n'est envoyée : seulement l'identifiant de conversion.
 */
export const GADS_ID = "AW-11045460629";

const CONVERSIONS = {
  /** Demande de devis PCMI Express (valeur 100 €). */
  devis: { send_to: `${GADS_ID}/5xtYCOKtgacdEJW18ZIp`, value: 100, currency: "EUR" },
  /** Clic appel / WhatsApp PCMI Express. */
  contact: { send_to: `${GADS_ID}/zySuCOWtgacdEJW18ZIp` },
} as const;

/** Événements du site (lib/analytics.ts) qui valent conversion Google Ads. */
const EVENT_TO_CONVERSION: Record<string, keyof typeof CONVERSIONS> = {
  devis_submit: "devis",
  dossier_submit: "devis",
  plan_de_masse_submit: "devis",
  whatsapp_click: "contact",
  phone_click: "contact",
};

export const CONSENT_KEY = "pmi-consentement-cookies";
export const OPEN_CONSENT_EVENT = "pmi:ouvrir-cookies";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Uniquement sur le domaine de production (pas de bruit depuis les prévisualisations). */
export function isProductionHost() {
  return typeof window !== "undefined" && /(^|\.)permis-maison-individuelle\.fr$/.test(window.location.hostname);
}

/** Envoie la conversion correspondant à un événement du site, s'il y en a une. */
export function sendGoogleAdsConversion(eventName: string) {
  const key = EVENT_TO_CONVERSION[eventName];
  if (!key || !isProductionHost() || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { ...CONVERSIONS[key], transport_type: "beacon" });
}

/** Met à jour le consentement (bannière ou page confidentialité). */
export function setAdsConsent(granted: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
  const v = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", { ad_storage: v, ad_user_data: v, ad_personalization: v });
}
