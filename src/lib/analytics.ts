/**
 * Mesure d'audience — Vercel Web Analytics et Umami (même identifiant de site
 * qu'ID Maîtrise, étiquette « permis-maison-individuelle » : voir UmamiScript).
 *
 * Sans cookie et sans identifiant individuel. Certains événements valent aussi
 * conversion Google Ads (voir lib/googleAds.ts, soumis au consentement). Ne jamais faire transiter ici de donnée personnelle
 * (nom, e-mail, téléphone, commune) : uniquement des libellés de parcours.
 */
import { track } from "@vercel/analytics";
import { sendGoogleAdsConversion } from "./googleAds";

/** Tranches de surface : on mesure le marché, jamais le projet nominatif. */
export type SurfaceBucket = "non-precisee" | "moins-de-80" | "80-119" | "120-149" | "150-et-plus";

export function surfaceBucket(surface: number | string | null | undefined): SurfaceBucket {
  const n = Number(surface);
  if (!surface || !Number.isFinite(n) || n <= 0) return "non-precisee";
  if (n < 80) return "moins-de-80";
  if (n < 120) return "80-119";
  if (n <= 149) return "120-149";
  return "150-et-plus";
}

/**
 * Événements suivis. Le typage force des propriétés cohérentes d'un appel à
 * l'autre : sans cela les tableaux de bord se remplissent de variantes.
 */
type Events = {
  /** Clic sur un appel à l'action menant au devis. */
  cta_click: { source: string; formule?: string };
  /** Résultat rendu par le sélecteur « Quelle formule pour mon projet ? ». */
  formula_finder_result: { formule: string; surface_bucket: SurfaceBucket };
  /** Montant affiché par le calculateur de taxe d'aménagement. */
  taxe_calcul_result: { surface_bucket: SurfaceBucket; residence: "principale" | "secondaire" };
  /** Panneau de chantier téléchargé ou envoyé à l'impression. */
  panneau_export: { format: "svg" | "impression"; type: "PC" | "DP" };
  /** Verdict rendu par le simulateur « permis ou déclaration préalable ? ». */
  autorisation_result: { projet: string; verdict: string };
  /** Résultat rendu par le calculateur de surface de plancher et d'emprise au sol. */
  surfaces_result: { surface_bucket: SurfaceBucket; architecte: "oui" | "non" };
  /** Première saisie réelle dans le formulaire de devis. */
  devis_start: { formule: string };
  /** Demande de devis transmise avec succès. */
  devis_submit: { formule: string; surface_bucket: SurfaceBucket };
  /** Fiche projet complète (CERFA 13406) transmise avec succès. */
  dossier_submit: Record<string, never>;
  /** Plan de masse existant transmis pour chiffrage. */
  plan_de_masse_submit: { fichiers: string };
  /** Demande de chiffrage de plans d'exécution transmise avec succès. */
  plans_exe_submit: { pack: string; lots: string };
  /** Demande d'étude thermique RE2020 transmise avec succès. */
  etude_thermique_submit: { prestations: string };
  /** Commande en ligne transmise (panier validé, passage à la saisie de l'IBAN). */
  commande_submit: { formule: string; echeances: string; surface_bucket: SurfaceBucket };
  /** Demande transmise depuis la page Express (campagne Google Ads). */
  express_submit: { eligible: string; urgent: string; surface_bucket: SurfaceBucket };
  /** Clic sur un numéro de téléphone. */
  tel_click: { source: string };
  /** Ouverture de la conversation WhatsApp. */
  whatsapp_click: { source: string };
  /** Clic sur un numéro de téléphone (lien tel:). */
  phone_click: { source: string };
  /** Clic sur l'appel à l'action d'un article de conseils. */
  article_cta_click: { slug: string; destination: string };
};

declare global {
  interface Window {
    umami?: { track: (nom?: string, donnees?: Record<string, string>) => void };
  }
}

/** Envoie un événement. Silencieux en local et si le script est bloqué. */
export function trackEvent<K extends keyof Events>(name: K, props: Events[K]) {
  try {
    track(name, props as Record<string, string>);
    window.umami?.track(name, props as Record<string, string>);
    sendGoogleAdsConversion(name);
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}
