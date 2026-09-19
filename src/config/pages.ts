/**
 * Inventaire des pages statiques du site.
 *
 * Source unique pour le sitemap (`app/sitemap.ts`) et pour `llms.txt`
 * (`app/llms.txt/route.ts`) : les deux ne peuvent pas se désynchroniser.
 *
 * `lastModified` se met à jour À LA MAIN quand le contenu visible de la page
 * change — pas à chaque déploiement. Une date de build sur toutes les pages
 * est un signal de fraîcheur nul : les moteurs voient sept pages « modifiées »
 * le même jour à la même seconde et cessent d'en tenir compte. Une correction
 * de code sans effet sur le texte lu par un visiteur ne justifie pas de
 * toucher à cette date.
 */

export interface StaticPage {
  path: string;
  /** Date ISO (YYYY-MM-DD) de la dernière modification du contenu visible. */
  lastModified: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  /** Une ligne pour llms.txt : ce que la page répond, pas ce qu'elle vend. */
  summary: string;
  /** Une page hors sitemap (légale, confirmation) n'est pas listée pour autant. */
  inSitemap?: boolean;
}

export const staticPages: StaticPage[] = [
  {
    path: "/",
    lastModified: "2026-09-19",
    changeFrequency: "weekly",
    priority: 1,
    summary:
      "Présentation du service : dossier de permis de construire de maison individuelle monté par un maître d'œuvre, pièces PCMI 1 à 8, partout en France.",
  },
  {
    path: "/tarifs",
    lastModified: "2026-09-19",
    changeFrequency: "weekly",
    priority: 1,
    summary:
      "Les trois formules à prix fixe (Essentiel 1 490 €, Complet 1 990 €, Premium 2 990 € TTC), le comparatif ligne par ligne, les options et les conditions de paiement.",
  },
  {
    path: "/permis-de-construire-maison",
    lastModified: "2026-09-18",
    changeFrequency: "monthly",
    priority: 0.9,
    summary:
      "Guide complet : permis ou déclaration préalable, seuil des 150 m², pièces du dossier, délai d'instruction de 2 mois, affichage, recours des tiers, validité de 3 ans.",
  },
  {
    path: "/a-propos",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.6,
    summary:
      "Qui monte les dossiers : ID Maîtrise, maîtrise d'œuvre au Havre, fondée par Dursun OZKAN. Méthode de travail, assurances et engagement de prix fixe.",
  },
  {
    path: "/conseils",
    lastModified: "2026-09-18",
    changeFrequency: "weekly",
    priority: 0.8,
    summary: "Articles pratiques écrits par un maître d'œuvre : prix, refus, panneau d'affichage, insertion graphique.",
  },
  {
    path: "/devis",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.8,
    summary: "Formulaire de demande de devis : réponse chiffrée sous 48 h ouvrées après lecture du PLU de la commune.",
  },
  {
    path: "/dossier",
    lastModified: "2026-09-18",
    changeFrequency: "monthly",
    priority: 0.7,
    summary: "Fiche projet complète calquée sur les rubriques du CERFA 13406, avec pièces jointes.",
  },
  {
    path: "/contact",
    lastModified: "2026-09-18",
    changeFrequency: "yearly",
    priority: 0.6,
    summary: "Contact direct, avec pièces jointes (plans, croquis, photos, arrêté de refus).",
  },
  {
    path: "/cgv",
    lastModified: "2026-09-19",
    changeFrequency: "yearly",
    priority: 0.2,
    summary: "Conditions générales de vente.",
  },
  {
    path: "/mentions-legales",
    lastModified: "2026-09-18",
    changeFrequency: "yearly",
    priority: 0.2,
    summary: "Mentions légales.",
  },
  {
    path: "/confidentialite",
    lastModified: "2026-09-19",
    changeFrequency: "yearly",
    priority: 0.2,
    summary: "Politique de confidentialité et mesure d'audience.",
    // Page volontairement en noindex : elle n'a rien à faire dans le sitemap.
    inSitemap: false,
  },
];

export const sitemapPages = staticPages.filter((p) => p.inSitemap !== false);
