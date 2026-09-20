/**
 * Mesure d'audience — Vercel Web Analytics.
 *
 * Sans cookie et sans identifiant individuel : aucune bannière de consentement
 * n'est requise. Ne jamais faire transiter ici de donnée personnelle
 * (nom, e-mail, téléphone, commune) : uniquement des libellés de parcours.
 */
import { track } from "@vercel/analytics";

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
  /** Ouverture de la conversation WhatsApp. */
  whatsapp_click: { source: string };
  /** Clic sur l'appel à l'action d'un article de conseils. */
  article_cta_click: { slug: string; destination: string };
};

/** Envoie un événement. Silencieux en local et si le script est bloqué. */
export function trackEvent<K extends keyof Events>(name: K, props: Events[K]) {
  try {
    track(name, props as Record<string, string>);
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}
