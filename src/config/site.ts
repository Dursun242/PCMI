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
  social: { instagram: string; google: string };
  authorSocial: { linkedin: string };
} = {
  name: "Permis by ID Maîtrise",
  shortName: "Permis",
  parent: "ID Maîtrise",
  /**
   * Nom affiché partout sur le site public : signature des articles et du
   * guide, auteur et fondateur dans les données structurées, page À propos,
   * llms.txt.
   *
   * `legal.director` garde le nom complet, et uniquement là où la loi ou un
   * échange contractuel l'impose : mentions légales et directeur de la
   * publication, signature des e-mails adressés à un client.
   */
  author: "Dursun O.",
  tagline: "Le permis de construire de votre maison, par un bureau d'études qui allie ingénierie et architecture, au prix juste.",
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
  /**
   * Comptes officiels de l'ENTREPRISE. Ils alimentent le pied de page et le
   * `sameAs` du schéma Organization, qui permet à Google de rattacher ces
   * comptes à l'entité — condition d'apparition dans le panneau de
   * connaissance. Laisser une chaîne vide masque simplement le lien.
   */
  social: {
    instagram: "https://www.instagram.com/idmaitrise/",
    /*
     * Fiche d'établissement Google. Lien court fourni par l'application : il
     * fonctionne et Google le résout, mais l'URL canonique de la fiche
     * (google.com/maps/place/… ou g.page/…) serait préférable dans un `sameAs`.
     * TODO(Dursun) : remplacer si vous récupérez cette adresse longue.
     */
    google: "https://maps.app.goo.gl/urk3phpj1f15pvPw6",
  },
  /**
   * Profils PERSONNELS du maître d'œuvre. Ils alimentent le `sameAs` de la
   * Person déclarée comme auteur des contenus, pas celui de l'Organization :
   * un profil individuel dans le `sameAs` d'une entreprise est une erreur de
   * modélisation que les moteurs ignorent, quand ils ne l'attribuent pas de
   * travers. Rattaché à l'auteur, il renforce au contraire la crédibilité des
   * articles.
   *
   * URL volontairement nettoyée de ses paramètres de partage (`utm_source`,
   * `utm_medium`…) : ils ne servent qu'au suivi d'un partage ponctuel et
   * n'ont rien à faire dans une référence canonique.
   */
  authorSocial: {
    linkedin: "https://www.linkedin.com/in/dursun-ozkan",
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
    notIncluded: ["Dépôt et suivi en mairie", "Rendus 3D réalistes", "Attestation RE2020 (fournie par votre constructeur ou thermicien, ou en option à 490 € TTC)"],
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
    forWho: "Vous partez d'une idée ou d'un croquis et vous voulez une maison pensée par un bureau d'études qui allie ingénierie et architecture, du premier trait au permis accordé.",
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
  { name: "Attestation RE2020 seule", priceTTC: 490, note: "Si vous avez déjà votre dossier." },
  { name: "Étude eaux pluviales", priceTTC: 710, note: "Dimensionnement d'infiltration / rétention." },
];

/**
 * Plans d'exécution (phase EXE) : la suite naturelle du permis.
 *
 * Les pièces PCMI sont dessinées au 1/100 pour l'instruction en mairie ; elles
 * ne suffisent pas à construire. Les plans EXE sont ceux que lisent le maçon,
 * le charpentier, l'électricien. Chaque lot est vendu à l'unité ou dans un
 * pack ; les prix ci-dessous sont des valeurs de départ « à partir de »,
 * à ajuster, et le devis reste établi après lecture du dossier de permis.
 *
 * Le dimensionnement des ouvrages porteurs (béton armé, charpente) relève de
 * l'ingénierie : c'est le pôle bureau d'études d'ID Maîtrise qui calcule et
 * signe la note de calcul, pendant que le pôle conception dessine.
 */
export type ExePlanId =
  | "fondations"
  | "beton-arme"
  | "plancher"
  | "charpente"
  | "couverture"
  | "menuiseries"
  | "electricite"
  | "plomberie"
  | "vrd"
  | "details";

export interface ExePlan {
  id: ExePlanId;
  name: string;
  /** Prix « à partir de », en euros TTC. */
  fromPriceTTC: number;
  /** Corps de métier qui lit ce plan sur le chantier. */
  forTrade: string;
  description: string;
  deliverables: string[];
  /** Lot dont le dimensionnement est calculé par notre bureau d'études structure. */
  withBet?: boolean;
}

export const exePlans: ExePlan[] = [
  {
    id: "fondations",
    name: "Plan de fondations",
    fromPriceTTC: 390,
    forTrade: "Maçon",
    description: "Implantation et niveaux des semelles filantes, plots, longrines et massifs, selon le rapport de sol.",
    deliverables: ["Plan coté au 1/50", "Niveaux d'assise et arases", "Réservations pour les réseaux", "Tableau des semelles"],
    withBet: true,
  },
  {
    id: "beton-arme",
    name: "Plans de béton armé",
    fromPriceTTC: 690,
    forTrade: "Maçon",
    description: "Coffrage et ferraillage des semelles, poteaux, poutres, chaînages et linteaux, avec la note de calcul de notre bureau d'études.",
    deliverables: ["Plans de coffrage", "Plans de ferraillage", "Nomenclature des aciers", "Note de calcul signée par l'ingénieur"],
    withBet: true,
  },
  {
    id: "plancher",
    name: "Plan de plancher",
    fromPriceTTC: 290,
    forTrade: "Maçon",
    description: "Sens de portée, poutrelles-hourdis ou dalle pleine, trémies, chevêtres et réservations de chaque niveau.",
    deliverables: ["Plan de pose par niveau", "Trémies et chevêtres", "Réservations pour gaines et évacuations"],
    withBet: true,
  },
  {
    id: "charpente",
    name: "Plan de charpente",
    fromPriceTTC: 490,
    forTrade: "Charpentier",
    description: "Charpente traditionnelle ou fermettes industrielles : implantation des fermes, pannes, chevrons, contreventement et assemblages.",
    deliverables: ["Plan d'implantation des fermes", "Coupes sur ferme au 1/20", "Sections et essences", "Détails d'assemblage et d'appui"],
    withBet: true,
  },
  {
    id: "couverture",
    name: "Plan de couverture et zinguerie",
    fromPriceTTC: 290,
    forTrade: "Couvreur",
    description: "Calepinage de la couverture, pentes, noues, faîtages, rives, sorties de toit et évacuation des eaux pluviales.",
    deliverables: ["Plan de toiture coté", "Détails de rives, égouts et faîtage", "Position des gouttières et descentes"],
  },
  {
    id: "menuiseries",
    name: "Plans de menuiseries extérieures",
    fromPriceTTC: 290,
    forTrade: "Menuisier",
    description: "Nomenclature et repérage de chaque baie : dimensions tableau, sens d'ouverture, allège, occultation et performances.",
    deliverables: ["Tableau des menuiseries", "Repérage sur plan et façades", "Détails de pose en tableau et seuil"],
  },
  {
    id: "electricite",
    name: "Plan d'électricité",
    fromPriceTTC: 390,
    forTrade: "Électricien",
    description: "Implantation des points lumineux, prises, interrupteurs, tableau et réseaux de communication, conforme à la NF C 15-100.",
    deliverables: ["Plan par niveau avec légende", "Schéma unifilaire de principe", "Nomenclature des circuits"],
  },
  {
    id: "plomberie",
    name: "Plan de plomberie et chauffage",
    fromPriceTTC: 390,
    forTrade: "Plombier-chauffagiste",
    description: "Alimentations, évacuations, ventilation et chauffage : tracés, diamètres de principe, chutes et positions d'appareils.",
    deliverables: ["Plan des évacuations et alimentations", "Plan de VMC", "Implantation des émetteurs ou du plancher chauffant"],
  },
  {
    id: "vrd",
    name: "Plan de réseaux extérieurs (VRD)",
    fromPriceTTC: 390,
    forTrade: "Terrassier",
    description: "Tracés et niveaux des réseaux enterrés, regards, assainissement, gestion des eaux pluviales, accès et terrassements.",
    deliverables: ["Plan de réseaux coté", "Profils et fils d'eau", "Détail des regards et du dispositif d'infiltration"],
  },
  {
    id: "details",
    name: "Coupes et détails techniques",
    fromPriceTTC: 390,
    forTrade: "Tous corps d'état",
    description: "Coupes au 1/50 et détails au 1/20 ou 1/10 des points singuliers : seuils, acrotères, jonctions mur-toiture, isolation et étanchéité à l'air.",
    deliverables: ["Coupes techniques cotées", "Détails des points singuliers", "Carnet de détails PDF et DWG"],
  },
];

export interface ExePack {
  id: "gros-oeuvre" | "complet";
  name: string;
  fromPriceTTC: number;
  promise: string;
  includes: ExePlanId[];
  delayWorkingDays: string;
}

/** Deux regroupements : le gros œuvre seul, ou la maison entière. */
export const exePacks: ExePack[] = [
  {
    id: "gros-oeuvre",
    name: "Pack structure",
    fromPriceTTC: 1690,
    promise: "Fondations, béton armé, plancher et charpente : tout ce qui porte la maison.",
    includes: ["fondations", "beton-arme", "plancher", "charpente"],
    delayWorkingDays: "15 jours ouvrés",
  },
  {
    id: "complet",
    name: "Pack EXE complet",
    fromPriceTTC: 2990,
    promise: "Les dix lots, coordonnés entre eux, pour consulter les artisans et construire sans aller-retour.",
    includes: exePlans.map((p) => p.id),
    delayWorkingDays: "25 jours ouvrés",
  },
];

/**
 * Études thermiques et environnementales RE2020.
 *
 * L'attestation RE2020 est obligatoire au dépôt du permis (et à l'achèvement)
 * pour toute maison neuve. L'étude complète calcule les indicateurs de la
 * réglementation : Bbio (besoin bioclimatique), Cep et Cep,nr (consommations),
 * DH (confort d'été), Ic énergie et Ic construction (analyse de cycle de vie).
 * Prix « à partir de », TTC, valeurs de départ à ajuster.
 */
export type ThermiqueId =
  | "attestation-depot"
  | "etude-complete"
  | "acv"
  | "attestation-achevement"
  | "variantes"
  | "pack-re2020";

export interface ThermiqueOffre {
  id: ThermiqueId;
  name: string;
  fromPriceTTC: number;
  /** Quand cette pièce intervient dans le projet. */
  when: string;
  description: string;
  deliverables: string[];
  highlight?: boolean;
}

export const thermique: ThermiqueOffre[] = [
  {
    id: "attestation-depot",
    name: "Attestation RE2020 au dépôt du permis",
    fromPriceTTC: 490,
    when: "Au dépôt du permis",
    description: "La pièce obligatoire jointe au CERFA : calcul du Bbio et vérification des exigences de moyens, à partir de vos plans.",
    deliverables: ["Calcul du Bbio", "Attestation officielle générée sur le site du ministère (RT-RE-bâtiment)", "Récapitulatif des hypothèses"],
  },
  {
    id: "etude-complete",
    name: "Étude thermique RE2020 complète",
    fromPriceTTC: 990,
    when: "Avant la consultation des artisans",
    description: "Tous les indicateurs de la réglementation : Bbio, Cep, Cep,nr, DH (confort d'été), Ic énergie et Ic construction, avec le choix des isolants, des menuiseries et du système de chauffage.",
    deliverables: ["Bbio, Cep, Cep,nr, DH", "Ic énergie et Ic construction (ACV)", "Fiche de synthèse et récapitulatif standardisé (RSEE)", "Prescriptions par lot pour les devis"],
    highlight: true,
  },
  {
    id: "acv",
    name: "Analyse de cycle de vie (ACV) seule",
    fromPriceTTC: 590,
    when: "Pendant la conception",
    description: "Calcul de l'impact carbone de la construction (Ic construction) à partir des fiches FDES et PEP des matériaux, avec les variantes qui font baisser le score.",
    deliverables: ["Ic construction par lot", "Comparatif de deux modes constructifs", "Recommandations matériaux"],
  },
  {
    id: "attestation-achevement",
    name: "Attestation RE2020 à l'achèvement",
    fromPriceTTC: 390,
    when: "À la fin des travaux",
    description: "La seconde attestation obligatoire, jointe à la déclaration d'achèvement (DAACT), établie à partir des matériaux réellement posés et du test d'étanchéité à l'air.",
    deliverables: ["Mise à jour de l'étude avec les factures et fiches techniques", "Attestation d'achèvement", "Vérification du test d'étanchéité à l'air (réalisé par un opérateur agréé)"],
  },
  {
    id: "variantes",
    name: "Variante ou optimisation",
    fromPriceTTC: 290,
    when: "À la demande",
    description: "Une simulation supplémentaire : changer d'isolant, de chauffage, de menuiseries, ou trouver le moyen le moins cher d'atteindre le seuil.",
    deliverables: ["Recalcul des indicateurs", "Comparatif avant / après", "Estimation du surcoût ou de l'économie"],
  },
  {
    id: "pack-re2020",
    name: "Pack RE2020 complet",
    fromPriceTTC: 1490,
    when: "Du permis à la livraison",
    description: "L'attestation au dépôt, l'étude complète avec ACV et l'attestation d'achèvement : tout le volet réglementaire thermique de la maison, suivi par le même thermicien.",
    deliverables: ["Attestation au dépôt du permis", "Étude complète : Bbio, Cep, DH, ACV", "Attestation à l'achèvement", "Une variante incluse"],
  },
];

/**
 * Les métiers réunis dans le bureau d'études. Alimentent la page À propos,
 * le `knowsAbout` des données structurées et le llms.txt : les termes
 * « architecte », « dessinateur », « ingénieur béton » sont ceux que tapent
 * les particuliers qui cherchent qui peut faire leur permis.
 */
export const metiers: { titre: string; role: string }[] = [
  { titre: "Dessinateur-projeteur en architecture", role: "Conception architecturale : implantation, volumes, façades, plans du permis de construire et plans d'exécution." },
  { titre: "Ingénieur béton armé", role: "Calcul des fondations, semelles, poteaux, poutres, planchers et chaînages ; plans de coffrage et de ferraillage, note de calcul." },
  { titre: "Ingénieur structure et charpente", role: "Dimensionnement des charpentes bois traditionnelles et fermettes, contreventement, descentes de charges." },
  { titre: "Thermicien RE2020", role: "Étude thermique et attestation de prise en compte de la RE2020 jointe au permis." },
  { titre: "Architecte partenaire inscrit à l'Ordre", role: "Signature du permis lorsque la loi l'impose, au-delà de 150 m² de surface de plancher." },
];

export const faq = [
  {
    q: "Ai-je besoin d'un architecte pour ma maison ?",
    a: "Non, tant que la surface de plancher de votre maison ne dépasse pas 150 m² (c'est le seuil légal). Nos trois formules à prix fixe s'appliquent jusqu'à 149 m² : un maître d'œuvre conçoit et dépose votre permis. Au-delà de 149 m², le permis est établi sur devis, avec notre architecte partenaire dès que le recours à un architecte devient légalement obligatoire (surface de plancher supérieure à 150 m²).",
  },
  {
    q: "Êtes-vous architecte, dessinateur ou ingénieur ?",
    a: "Les trois métiers travaillent ensemble chez ID Maîtrise : un dessinateur-projeteur assure la conception architecturale (implantation, volumes, façades, plans), un ingénieur béton armé et structure calcule ce qui porte (fondations, planchers, charpente), et un thermicien établit l'attestation RE2020. Nous ne sommes pas inscrits à l'Ordre des architectes : lorsque le recours à un architecte est légalement obligatoire (surface de plancher supérieure à 150 m²), le permis est signé par notre architecte partenaire inscrit à l'Ordre.",
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
    a: "Elle est incluse dans les formules Complet et Premium. Dans la formule Essentiel, elle est fournie par votre constructeur ou thermicien si vous en avez déjà un, ou proposée en option à 490 € TTC. Cette attestation est obligatoire au dépôt du permis pour toute construction neuve.",
  },
  {
    q: "Ma maison fait plus de 149 m². Que se passe-t-il ?",
    a: "Les formules Essentiel, Complet et Premium ne s'appliquent pas. Décrivez votre projet dans le formulaire de devis : nous revenons vers vous sous 4 h ouvrées avec une proposition sur mesure, montée avec notre architecte partenaire.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Un acompte de 40 % au démarrage, le solde à la remise du dossier prêt à déposer. Paiement par virement ou carte bancaire. Aucun frais caché : le prix affiché est le prix payé.",
  },
];
