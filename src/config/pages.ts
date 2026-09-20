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
    lastModified: "2026-09-20",
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
    lastModified: "2026-09-19",
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
      "Qui monte les dossiers : ID Maîtrise, bureau d'études au Havre qui allie ingénierie de la construction et conception architecturale, fondé par Dursun O. Méthode de travail, assurances et engagement de prix fixe.",
  },
  {
    path: "/conseils",
    lastModified: "2026-09-18",
    changeFrequency: "weekly",
    priority: 0.8,
    summary: "Articles pratiques écrits par un maître d'œuvre : prix, refus, panneau d'affichage, insertion graphique.",
  },
  {
    path: "/plan-de-masse",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.8,
    summary:
      "Envoi d'un plan de masse existant (PDF, DWG, DXF) pour chiffrage : ce que la pièce PCMI 2 doit montrer et ce qui manque le plus souvent.",
  },
  {
    path: "/plans-execution",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.9,
    summary:
      "Plans d'exécution après le permis : fondations, béton armé, plancher, charpente, couverture, menuiseries, électricité, plomberie, VRD, détails. À l'unité ou en pack, à partir de 290 € TTC, calcul de structure par le bureau d'études d'ID Maîtrise.",
  },
  {
    path: "/etude-thermique-re2020",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.9,
    summary:
      "Études thermiques RE2020 : attestation au dépôt du permis (490 €), étude complète Bbio, Cep, DH et ACV, attestation d'achèvement, variantes. Explication des cinq indicateurs de la RE2020.",
  },
  {
    path: "/devis",
    lastModified: "2026-09-19",
    changeFrequency: "monthly",
    priority: 0.8,
    summary: "Formulaire de demande de devis : réponse chiffrée sous 4 h ouvrées après lecture du PLU de la commune.",
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
