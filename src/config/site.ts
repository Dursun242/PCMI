/**
 * Configuration centrale du site.
 * Tout ce qui est commercial (prix, délais, coordonnées, textes clés)
 * se modifie ICI et nulle part ailleurs.
 */

export const site: {
  name: string;
  shortName: string;
  parent: string;
  author: string;
  tagline: string;
  url: string;
  parentUrl: string;
  email: string;
  phone: string;
  address: { street: string; zip: string; city: string; region: string; country: string };
  legal: { company: string; director: string; siren: string; rcs: string; vat: string; insurer: string; host: string };
  social: { linkedin: string };
} = {
  name: "Permis by ID Maîtrise",
  shortName: "Permis",
  parent: "ID Maîtrise",
  /**
   * Signature des contenus éditoriaux (guide, articles) et auteur déclaré dans
   * les données structurées. Volontairement distinct de `legal.director`, qui
   * porte le nom complet là où la loi ou un contrat l'exige : mentions légales,
   * directeur de la publication, signature des e-mails adressés à un client.
   */
  author: "Dursun O.",
  tagline: "Le permis de construire de votre maison, dessiné par un maître d'œuvre, au prix juste.",
  // Domaine de production
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://permis-maison-individuelle.fr",
  parentUrl: "https://www.id-maitrise.com",
  email: "contact@id-maitrise.com",
  // Laisser vide pour masquer le téléphone sur le site
  phone: "06 79 11 60 85",
  address: {
    street: "9 rue Henry Genestal",
    zip: "76600",
    city: "Le Havre",
    region: "Normandie",
    country: "FR",
  },
  legal: {
    company: "SARL ID MAÎTRISE",
    director: "Dursun OZKAN",
    // À compléter : assurance RC pro
    siren: "921536181", // source : societe.com / Pappers / Annuaire des Entreprises
    rcs: "Le Havre",
    vat: "FR12921536181", // calculée depuis le SIREN (formule INSEE), non confirmée sur un registre officiel
    insurer: "",
    host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
  social: {
    linkedin: "",
  },
};

export type PlanId = "essentiel" | "complet" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  priceTTC: number; // en euros TTC (TVA 20 % incluse)
  highlight?: boolean;
  promise: string;
  forWho: string;
  delayWorkingDays: string;
  features: string[];
  notIncluded?: string[];
}

/**
 * Les trois formules. Prix affichés TTC (obligatoire pour une offre aux particuliers).
 * Les montants ci-dessous sont des valeurs de départ à ajuster.
 */
export const VAT = 0.2;
export const ht = (ttc: number) => Math.round(ttc / (1 + VAT));
export const plans: Plan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    priceTTC: 1490,
    promise: "Le dossier complet, prêt à déposer.",
    forWho: "Vous avez déjà un plan (constructeur, esquisse, plan Kasaplan) et vous voulez un dossier PCMI conforme, sans surprise.",
    delayWorkingDays: "10 jours ouvrés",
    features: [
      "Pièces PCMI 1 à 8 complètes",
      "Plans de masse, coupes, façades et toitures à l'échelle",
      "Notice descriptive rédigée (PCMI 4)",
      "Insertion graphique 2D dans l'environnement",
      "CERFA rempli et vérifié",
      "Contrôle de conformité au PLU / PLUi de votre commune",
      "Une série de modifications avant dépôt",
    ],
    notIncluded: ["Dépôt et suivi en mairie", "Rendus 3D réalistes", "Attestation RE2020 (fournie par votre constructeur ou thermicien, ou en option à 350 € TTC)"],
  },
  {
    id: "complet",
    name: "Complet",
    priceTTC: 1990,
    highlight: true,
    promise: "Le dossier, le dépôt, et le suivi jusqu'à l'accord.",
    forWho: "Vous voulez confier tout le parcours administratif à un professionnel et ne plus y penser.",
    delayWorkingDays: "15 jours ouvrés",
    features: [
      "Tout Essentiel",
      "Dépôt dématérialisé ou papier auprès de votre mairie",
      "Réponses aux demandes de pièces complémentaires",
      "Modifications illimitées jusqu'à l'obtention du permis (même terrain, même programme)",
      "Insertion 3D réaliste de la maison sur son terrain (PCMI 6)",
      "Attestation de prise en compte de la RE2020",
      "Panneau d'affichage réglementaire prêt à imprimer",
    ],
    notIncluded: ["Étude de gestion des eaux pluviales"],
  },
  {
    id: "premium",
    name: "Premium",
    priceTTC: 2990,
    promise: "Conception, rendus et accompagnement sur mesure.",
    forWho: "Vous partez d'une idée ou d'un croquis et vous voulez une maison pensée par un maître d'œuvre, du premier trait au permis accordé.",
    delayWorkingDays: "20 jours ouvrés",
    features: [
      "Tout Complet",
      "Conception des plans à partir de vos besoins (2 esquisses + ajustements)",
      "3 rendus 3D photoréalistes extérieurs",
      "Étude de gestion des eaux pluviales si exigée par le PLU",
      "Rendez-vous visio à chaque étape clé",
      "Relecture du CCMI ou du devis constructeur",
      "Interlocuteur unique jusqu'au permis purgé de tout recours",
    ],
  },
];

export const options = [
  { name: "Permis modificatif", priceTTC: 830, note: "Si le projet évolue après l'accord." },
  { name: "Déclaration préalable (DP) à la place du PC", priceTTC: 1070, note: "Extension, garage, abri, clôture, piscine." },
  { name: "Rendu 3D supplémentaire", priceTTC: 230, note: "Par vue." },
  { name: "Attestation RE2020 seule", priceTTC: 350, note: "Si vous avez déjà votre dossier." },
  { name: "Étude eaux pluviales", priceTTC: 710, note: "Dimensionnement d'infiltration / rétention." },
];

export const faq = [
  {
    q: "Ai-je besoin d'un architecte pour ma maison ?",
    a: "Non, tant que la surface de plancher de votre maison ne dépasse pas 150 m² (c'est le seuil légal). Nos trois formules à prix fixe s'appliquent jusqu'à 149 m² : un maître d'œuvre conçoit et dépose votre permis. Au-delà de 149 m², le permis est établi sur devis, avec notre architecte partenaire dès que le recours à un architecte devient légalement obligatoire (surface de plancher supérieure à 150 m²).",
  },
  {
    q: "Travaillez-vous partout en France ?",
    a: "Oui. Le dossier est conçu à distance à partir de vos documents (plan du terrain, plan constructeur, photos) et déposé sur la plateforme dématérialisée de votre commune. Nous échangeons par visio, téléphone et e-mail. Un déplacement sur site est possible en Normandie.",
  },
  {
    q: "Quel est le délai pour obtenir le permis ?",
    a: "La mairie dispose de 2 mois pour instruire un permis de construire de maison individuelle (3 mois si le projet est situé dans un secteur protégé ou soumis à l'avis de l'Architecte des Bâtiments de France). Comptez ensuite 2 mois d'affichage pour purger le recours des tiers.",
  },
  {
    q: "Que se passe-t-il si la mairie demande des pièces complémentaires ?",
    a: "Avec les formules Complet et Premium, nous répondons à toutes les demandes de la mairie et modifions le dossier autant de fois que nécessaire jusqu'à l'obtention du permis, sans supplément, pour un même terrain et un même programme.",
  },
  {
    q: "L'attestation RE2020 est-elle incluse ?",
    a: "Elle est incluse dans les formules Complet et Premium. Dans la formule Essentiel, elle est fournie par votre constructeur ou thermicien si vous en avez déjà un, ou proposée en option à 350 € TTC. Cette attestation est obligatoire au dépôt du permis pour toute construction neuve.",
  },
  {
    q: "Ma maison fait plus de 149 m². Que se passe-t-il ?",
    a: "Les formules Essentiel, Complet et Premium ne s'appliquent pas. Décrivez votre projet dans le formulaire de devis : nous revenons vers vous sous 48 h avec une proposition sur mesure, montée avec notre architecte partenaire.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Un acompte de 40 % au démarrage, le solde à la remise du dossier prêt à déposer. Paiement par virement ou carte bancaire. Aucun frais caché : le prix affiché est le prix payé.",
  },
];
