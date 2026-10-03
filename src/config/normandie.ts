/**
 * Données des pages régionales (/permis-de-construire-normandie).
 *
 * Chaque fait réglementaire porte sa source : une erreur sur un PLUi, un
 * risque ou un périmètre ABF décrédibiliserait un maître d'œuvre auprès de
 * ses voisins. Un fait non vérifié n'entre pas ici. Les tests
 * (src/lib/normandie.test.ts) refusent un fait sans source https et une ville
 * sans contenu propre suffisant — Google sanctionne les pages « ville »
 * dupliquées, qui ne changent que le nom de la commune.
 *
 * À relire une fois par an : les PLUi sont révisés, les PPRI aussi.
 */

export interface Source {
  label: string;
  url: string;
}

export interface Fait {
  texte: string;
  source: Source;
}

export type CodeDepartement = "14" | "27" | "50" | "61" | "76";

export interface Departement {
  code: CodeDepartement;
  nom: string;
  /** Conseil d'architecture, d'urbanisme et de l'environnement : conseil gratuit aux particuliers. */
  caue: Source;
  /** Enquête EPTB (SDES / DREAL Normandie) sur les permis de particuliers. */
  terrain?: { annee: number; prixM2: number; surfaceM2: number; permis?: number; source: Source };
}

export interface Ville {
  slug: string;
  nom: string;
  /** Avec sa préposition : « au Havre », « à Rouen ». */
  a: string;
  /** « autour du Havre », « autour d'Évreux » (élision écrite à la main). */
  autour: string;
  departement: CodeDepartement;
  intercommunalite: string;
  /** Meta description, rédigée à la main (≤ 160 caractères). */
  description: string;
  /** Une à deux phrases propres à la ville, en tête de page. */
  accroche: string;
  urbanisme: Fait;
  depot: Fait;
  risques: Fait[];
  patrimoine: Fait[];
  architecture?: Fait;
  communesVoisines: string[];
  faq: { q: string; a: string }[];
}

const EPTB_NORMANDIE_2024: Source = {
  label: "Enquête EPTB 2024, DREAL Normandie",
  url: "https://dreal.statistiques.developpement-durable.gouv.fr/eptb/2024/normandie/EPTB_prix_terrain_bati_Normandie_2024.pdf",
};

/** Chiffres régionaux (permis de maisons obtenus par des particuliers, hors promoteurs). */
export const chiffresNormandie = {
  annee: 2024,
  permis: 3008,
  prixTerrainM2: 73,
  coutConstruction: 207300,
  source: EPTB_NORMANDIE_2024,
};

/** Date de dernière revue des pages villes (sitemap). À mettre à jour quand leur contenu change. */
export const VILLES_LAST_MODIFIED = "2026-10-03";

/** Majoration du délai d'instruction en site patrimonial remarquable ou aux abords d'un monument historique. */
export const delaiAbf: Fait = {
  texte:
    "Le délai d'instruction d'un permis de maison est de 2 mois. Il est majoré d'un mois, soit 3 mois, quand le projet est situé dans un site patrimonial remarquable ou aux abords d'un monument historique, parce que l'Architecte des Bâtiments de France doit donner son avis.",
  source: { label: "Code de l'urbanisme, art. R.423-24", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000050929926/" },
};

export const departements: Departement[] = [
  {
    code: "76",
    nom: "Seine-Maritime",
    caue: { label: "CAUE de Seine-Maritime", url: "https://www.caue76.fr/conseil-aux-habitants/" },
    terrain: { annee: 2024, prixM2: 71, surfaceM2: 1047, source: EPTB_NORMANDIE_2024 },
  },
  {
    code: "14",
    nom: "Calvados",
    caue: { label: "CAUE du Calvados", url: "https://caue14.com/je-suis-un-particulier/nos-missions/" },
    terrain: { annee: 2024, prixM2: 120, surfaceM2: 721, source: EPTB_NORMANDIE_2024 },
  },
  {
    code: "50",
    nom: "Manche",
    caue: { label: "CAUE de la Manche", url: "https://www.caue50.fr/" },
    terrain: { annee: 2024, prixM2: 71, surfaceM2: 859, source: EPTB_NORMANDIE_2024 },
  },
  {
    code: "27",
    nom: "Eure",
    caue: { label: "CAUE de l'Eure", url: "https://caue27.fr/" },
  },
  {
    code: "61",
    nom: "Orne",
    caue: {
      label: "CAUE de l'Orne",
      url: "https://www.caue61.fr/des-conseils-architecturaux-aux-collectivites-locales/architecture/des-conseils-architecturaux-aux-particuliers/",
    },
  },
];

const EURE_CAVITES: Source = {
  label: "Préfecture de l'Eure, urbanisme et cavités souterraines",
  url: "https://www.eure.gouv.fr/Actions-de-l-Etat/Risques-majeurs/Risques-naturels/Marnieres-et-autres-cavites-souterraines/Urbanisme-et-cavites-souterraines",
};

/** Par population décroissante. */
export const villes: Ville[] = [
  {
    slug: "le-havre",
    nom: "Le Havre",
    a: "au Havre",
    autour: "autour du Havre",
    departement: "76",
    intercommunalite: "Le Havre Seine Métropole, communauté urbaine de 54 communes",
    description:
      "Permis de construire de maison au Havre : PLUi Le Havre Seine Métropole, marnières, secteur Perret. Maître d'œuvre installé au Havre, prix fixe.",
    accroche:
      "C'est notre ville : le bureau d'ID Maîtrise est rue Henry Genestal. Depuis avril 2026, les 54 communes de Le Havre Seine Métropole partagent un même PLUi, que nous lisons pour chaque terrain avant de chiffrer.",
    urbanisme: {
      texte:
        "Le PLUi Le Havre Seine Métropole a été approuvé en conseil communautaire le 12 février 2026 et s'applique depuis le 1er avril 2026 dans les 54 communes de la communauté urbaine.",
      source: { label: "Le Havre Seine Métropole, PLUi", url: "https://www.lehavreseinemetropole.fr/amonservice/plan-local-durbanisme-intercommunal-plui" },
    },
    depot: {
      texte:
        "Dépôt en ligne sur le guichet numérique de Le Havre Seine Métropole, ou en mairie. L'instruction est assurée par les services de la communauté urbaine ; la mairie de votre commune reste votre premier interlocuteur.",
      source: { label: "Le Havre Seine Métropole, autorisations d'urbanisme", url: "https://www.lehavreseinemetropole.fr/amonservice/demarche/autorisations-durbanisme" },
    },
    risques: [
      {
        texte:
          "Marnières et cavités souterraines : autour d'un indice de cavité, un périmètre de risque (60 m pour une marnière) peut conduire à refuser un permis tant que le risque n'est pas levé. À vérifier avant même d'acheter le terrain.",
        source: { label: "Le Havre Seine Métropole, cavités souterraines", url: "https://www.lehavreseinemetropole.fr/cavites-souterraines" },
      },
      {
        texte:
          "La plaine alluviale de l'embouchure de la Seine est exposée aux inondations et à la submersion marine : un plan de prévention des risques littoraux y encadre les constructions, au Havre comme à Harfleur ou Gonfreville-l'Orcher.",
        source: {
          label: "DREAL Normandie, stratégie locale de gestion du risque d'inondation du Havre",
          url: "https://www.normandie.developpement-durable.gouv.fr/IMG/pdf/slgri_havre_approuvee.compressed.pdf",
        },
      },
      {
        texte:
          "Près de la zone industrialo-portuaire, le plan de prévention des risques technologiques approuvé en 2016 peut imposer des règles de construction ou rendre certains secteurs inconstructibles.",
        source: {
          label: "Préfecture de Seine-Maritime, PPRT de la zone industrialo-portuaire",
          url: "https://www.seine-maritime.gouv.fr/layout/set/print/Actualites/Archives/Archives-2016/PPRT-de-la-zone-industrielle-et-portuaire-du-Havre",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Le centre reconstruit par Auguste Perret, inscrit au patrimoine mondial de l'UNESCO en 2005, est un site patrimonial remarquable : tout projet y passe par l'avis de l'Architecte des Bâtiments de France, et l'instruction prend 3 mois au lieu de 2.",
        source: { label: "Ville du Havre, travaux en secteur protégé", url: "https://lehavre.fr/services-au-quotidien/habitat-urbanisme/travaux-en-secteur-protege-patrimoine-unesco" },
      },
    ],
    communesVoisines: ["Montivilliers", "Harfleur", "Octeville-sur-Mer", "Gonfreville-l'Orcher", "Sainte-Adresse"],
    faq: [
      {
        q: "Pouvez-vous voir le terrain avec moi ?",
        a: "Oui. Notre bureau est au Havre, rue Henry Genestal : nous pouvons vous y recevoir ou passer sur le terrain dans l'agglomération. Le reste du suivi se fait par e-mail, téléphone ou visio.",
      },
      {
        q: "Mon terrain est-il concerné par une marnière ?",
        a: "Les indices de cavités sont reportés dans les documents de la communauté urbaine. Nous les regardons avant de chiffrer : si un périmètre de risque touche votre parcelle, une étude de levée de doute par un bureau spécialisé peut être nécessaire avant de déposer.",
      },
      {
        q: "Quel délai pour un permis de maison au Havre ?",
        a: "Deux mois à compter du dépôt d'un dossier complet. Dans le site patrimonial remarquable du centre reconstruit, l'avis de l'Architecte des Bâtiments de France ajoute un mois.",
      },
    ],
  },
  {
    slug: "rouen",
    nom: "Rouen",
    a: "à Rouen",
    autour: "autour de Rouen",
    departement: "76",
    intercommunalite: "la Métropole Rouen Normandie, qui regroupe 71 communes",
    description:
      "Permis de construire de maison à Rouen : PLU métropolitain, cavités, PPRI de la Seine, secteur sauvegardé. Dossier complet par un maître d'œuvre normand.",
    accroche:
      "Entre la boucle de la Seine, les vallons du Cailly et du Robec et les plateaux de Bois-Guillaume ou Isneauville, les règles changent d'un quartier à l'autre : à Rouen, le terrain dicte le projet.",
    urbanisme: {
      texte:
        "Le PLU métropolitain de la Métropole Rouen Normandie, approuvé le 13 février 2020, s'applique dans les 71 communes. Il a été modifié plusieurs fois depuis, et sa révision générale, lancée fin 2022, est en cours.",
      source: {
        label: "Métropole Rouen Normandie, PLU métropolitain",
        url: "https://www.metropole-rouen-normandie.fr/urbanisme/consulter-le-plan-local-durbanisme-metropolitain",
      },
    },
    depot: {
      texte:
        "Dépôt en ligne sur le guichet numérique de la Métropole, ou au service urbanisme. Pour Rouen, l'accueil se fait à la direction de l'urbanisme réglementaire, avenue Pasteur.",
      source: { label: "Ville de Rouen, permis de construire", url: "https://rouen.fr/permis-de-construire" },
    },
    risques: [
      {
        texte:
          "Cavités souterraines : le PLU métropolitain trace des périmètres de risque autour des indices (60 m pour une marnière, 35 m pour une sablière ou une bétoire, 15 m pour une ballastière) dans lesquels les constructions nouvelles sont interdites.",
        source: { label: "Métropole Rouen Normandie, cavités souterraines", url: "https://www.metropole-rouen-normandie.fr/risques-naturels/cavites-souterraines" },
      },
      {
        texte:
          "En bord de Seine, le plan de prévention des risques d'inondation de la boucle de Rouen (2009, modifié en 2013) fixe des règles de construction dans 18 communes, dont Rouen.",
        source: {
          label: "Préfecture de Seine-Maritime, PPRN de la boucle de Rouen",
          url: "https://www.seine-maritime.gouv.fr/Publications/Information-des-acquereurs-et-locataires-sur-les-risques-majeurs/Recherche-par-Plan-de-Prevention-des-Risques-PPR/PPRN-Vallee-de-la-SEINE-Boucle-de-ROUEN",
        },
      },
      {
        texte:
          "Plus au nord, le plan de prévention des bassins versants du Cailly, de l'Aubette et du Robec, approuvé en 2022, couvre aussi le ruissellement et les remontées de nappe.",
        source: {
          label: "Préfecture de Seine-Maritime, PPRN Cailly, Aubette et Robec",
          url: "https://www.seine-maritime.gouv.fr/Publications/Information-des-acquereurs-et-locataires-sur-les-risques-majeurs/Recherche-par-Plan-de-Prevention-des-Risques-PPR/PPRN-Bassin-versant-du-CAILLY-de-l-AUBETTE-et-du-ROBEC",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Le centre historique, ancien secteur sauvegardé, est un site patrimonial remarquable régi par un plan de sauvegarde et de mise en valeur, et la ville compte de nombreux monuments historiques : avis de l'Architecte des Bâtiments de France et instruction en 3 mois.",
        source: {
          label: "Ville de Rouen, plan de sauvegarde et de mise en valeur",
          url: "https://rouen.fr/sites/default/files/download/2019/plan_de_sauvegarde_et_de_mise_en_valeur_de_rouen.pdf",
        },
      },
    ],
    communesVoisines: ["Bois-Guillaume", "Mont-Saint-Aignan", "Isneauville", "Bonsecours"],
    faq: [
      {
        q: "Comment savoir dans quelle zone du PLU est mon terrain ?",
        a: "Le PLU métropolitain se consulte sur le site de la Métropole et sur le Géoportail de l'urbanisme. Envoyez-nous l'adresse ou la référence cadastrale : nous identifions la zone et ses règles avant de chiffrer.",
      },
      {
        q: "Un indice de marnière près de mon terrain bloque-t-il le projet ?",
        a: "Pas forcément, mais dans le périmètre de risque les constructions nouvelles sont interdites tant que le doute n'est pas levé. Une étude par un bureau spécialisé permet parfois de réduire ou supprimer ce périmètre.",
      },
    ],
  },
  {
    slug: "caen",
    nom: "Caen",
    a: "à Caen",
    autour: "autour de Caen",
    departement: "14",
    intercommunalite: "la communauté urbaine Caen la Mer",
    description:
      "Permis de construire de maison à Caen : PLU en vigueur et futur PLUi-HM, carrières, vallée de l'Orne, site patrimonial. Dossier PCMI complet, prix fixe.",
    accroche:
      "Caen est entre deux documents d'urbanisme : le PLU communal s'applique encore, et le PLUi-HM de Caen la Mer est en enquête publique pour une approbation annoncée début 2027. Pour un dépôt dans les prochains mois, le calendrier compte.",
    urbanisme: {
      texte:
        "À Caen, c'est encore le PLU communal, approuvé en 2013 et modifié depuis, qui s'applique. Le PLUi-HM de Caen la Mer le remplacera après son approbation, annoncée pour début 2027.",
      source: { label: "Ville de Caen, plan local d'urbanisme", url: "https://caen.fr/plan-local-durbanisme-plu" },
    },
    depot: {
      texte:
        "Dépôt en ligne sur le guichet unique de Caen la Mer, ou en version papier à la direction de l'urbanisme, rue Rosa Parks.",
      source: { label: "Ville de Caen, entreprendre des travaux", url: "https://caen.fr/entreprendre-des-travaux" },
    },
    risques: [
      {
        texte:
          "Le plan de prévention multirisques de la basse vallée de l'Orne, approuvé en 2021, encadre les constructions exposées aux débordements, à Caen comme dans les communes voisines.",
        source: {
          label: "Préfecture du Calvados, PPR multirisques de la basse vallée de l'Orne",
          url: "https://www.calvados.gouv.fr/contenu/telechargement/15436/126568/file/02_20210810_pprm-bvo_note_presentation.pdf",
        },
      },
      {
        texte:
          "Une partie de la ville repose sur d'anciennes carrières souterraines de pierre de Caen (environ 80 ha selon le document communal sur les risques majeurs), avec un risque d'effondrement à vérifier avant tout projet.",
        source: { label: "Ville de Caen, DICRIM", url: "https://caen.fr/sites/default/files/2019-03/Dicrim.pdf" },
      },
      {
        texte:
          "Les inondations par remontée de nappe sont aussi signalées : l'atlas régional permet de vérifier un terrain avant de prévoir un sous-sol.",
        source: { label: "DREAL Normandie, atlas des remontées de nappes", url: "https://www.normandie.developpement-durable.gouv.fr/atlas-des-remontees-de-nappes-zns-a6218.html" },
      },
    ],
    patrimoine: [
      {
        texte:
          "Caen est un site patrimonial remarquable depuis 2021, sur 712 ha : centre ancien, ville classique, quartiers de la Reconstruction et faubourgs. Dans ce périmètre, l'avis de l'Architecte des Bâtiments de France est requis et l'instruction prend 3 mois.",
        source: { label: "Ville de Caen, site patrimonial remarquable", url: "https://caen.fr/spr-proteger-et-valoriser" },
      },
    ],
    communesVoisines: ["Bretteville-sur-Odon", "Fleury-sur-Orne", "Louvigny", "Saint-André-sur-Orne"],
    faq: [
      {
        q: "Faut-il attendre le PLUi-HM de Caen la Mer pour déposer ?",
        a: "Non : un permis est instruit selon le document en vigueur au jour de la décision. Mais tant que le PLUi-HM est en préparation, la commune peut opposer un sursis à statuer à un projet qui compromettrait le futur plan. Nous vérifions donc les deux règlements pour que votre projet reste conforme à l'un comme à l'autre.",
      },
      {
        q: "Mon terrain est-il sur une ancienne carrière ?",
        a: "Le document communal sur les risques majeurs et les services de la Ville recensent les secteurs de carrières. Nous le regardons avant de chiffrer ; en cas de doute, une étude de sol est le bon réflexe avant de dessiner.",
      },
    ],
  },
  {
    slug: "cherbourg-en-cotentin",
    nom: "Cherbourg-en-Cotentin",
    a: "à Cherbourg-en-Cotentin",
    autour: "autour de Cherbourg",
    departement: "50",
    intercommunalite: "la communauté d'agglomération du Cotentin",
    description:
      "Permis de construire de maison à Cherbourg-en-Cotentin : PLU des cinq communes déléguées, risques littoraux, toitures ardoise. Prix fixe, dossier complet.",
    accroche:
      "Entre la rade, les vallées de la Divette et du Trottebec et les coteaux de La Glacerie, construire à Cherbourg-en-Cotentin, c'est composer avec la mer, le vent et une tradition de toitures sombres.",
    urbanisme: {
      texte:
        "Le PLU de Cherbourg-en-Cotentin couvre les cinq communes déléguées : Cherbourg-Octeville, Équeurdreville-Hainneville, Querqueville, Tourlaville et La Glacerie. Il évolue par modifications successives, conduites par l'agglomération du Cotentin.",
      source: {
        label: "Agglomération du Cotentin, PLU de Cherbourg-en-Cotentin",
        url: "https://www.lecotentin.fr/mes-services/habitat-et-urbanisme/evolution-de-documents-durbanisme/modification-8-du-plu-de-cherbourg-en-cotentin/",
      },
    },
    depot: {
      texte:
        "Dépôt en ligne sur le guichet unique de l'agglomération du Cotentin, ou en mairie. L'instruction est assurée par le service commun d'urbanisme de l'agglomération.",
      source: {
        label: "Ville de Cherbourg-en-Cotentin, démarches d'urbanisme",
        url: "https://www.cherbourg.fr/demarches/urbanisme/entreprendre-des-travaux-demarches-et-formulaires/faire-mes-demarches-durbanisme-permis-de-construire/",
      },
    },
    risques: [
      {
        texte:
          "Le plan de prévention multirisques de la région de Cherbourg, approuvé fin 2019, couvre 18 communes et trois risques : débordement des cours d'eau, submersion marine (changement climatique compris) et chutes de blocs.",
        source: {
          label: "Préfecture de la Manche, PPRN de la région de Cherbourg",
          url: "https://www.manche.gouv.fr/Actions-de-l-Etat/Environnement-risques-naturels-et-technologiques/Risques-Naturels-et-Technologiques/Plans-de-prevention-des-risques/Plans-de-Prevention-des-Risques-Naturels-PPRN/Les-PPRN-dans-la-Manche/Plans-de-Prevention-des-Risques-Multirisques/PPRN-de-la-Region-de-Cherbourg-approuve-le-30-12-2019",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Aux abords des monuments historiques de la ville, l'Architecte des Bâtiments de France donne son avis et l'instruction passe de 2 à 3 mois.",
        source: delaiAbf.source,
      },
    ],
    architecture: {
      texte:
        "Le règlement du PLU demande des couvertures de teinte et d'aspect ardoise ou schiste ; la petite tuile plate n'est admise qu'à titre exceptionnel, en teinte ardoise.",
      source: { label: "Règlement du PLU de Cherbourg-en-Cotentin", url: "https://www.lecotentin.fr/wp-content/uploads/2025/08/4-RE.pdf" },
    },
    communesVoisines: ["Tollevast", "Martinvast", "La Hague"],
    faq: [
      {
        q: "Mon terrain est-il exposé à la submersion marine ?",
        a: "Le plan de prévention multirisques de la région de Cherbourg délimite les zones concernées. Nous le croisons avec le PLU avant de chiffrer : en zone réglementée, la hauteur du plancher et l'implantation peuvent être imposées.",
      },
      {
        q: "Puis-je couvrir ma maison en tuiles ?",
        a: "Le PLU impose en principe un aspect ardoise ou schiste. La petite tuile plate de teinte ardoise reste une exception à justifier : nous en tenons compte dès les premières esquisses.",
      },
    ],
  },
  {
    slug: "evreux",
    nom: "Évreux",
    a: "à Évreux",
    autour: "autour d'Évreux",
    departement: "27",
    intercommunalite: "l'agglomération Évreux Portes de Normandie",
    description:
      "Permis de construire de maison à Évreux : PLUi-HD, marnières de l'Eure, vallée de l'Iton, site patrimonial de 2024. Maître d'œuvre normand, prix fixe.",
    accroche:
      "Dans l'Eure, la première question n'est pas le style de la maison mais le sous-sol : avec des milliers de marnières recensées, un terrain d'Évreux ou de Guichainville se vérifie avant de se dessiner.",
    urbanisme: {
      texte:
        "Le PLUi-HD d'Évreux Portes de Normandie, approuvé en décembre 2019 et ajusté depuis, s'applique à Évreux et aux communes de l'agglomération.",
      source: {
        label: "Évreux Portes de Normandie, PLUi-HD",
        url: "https://www.evreuxportesdenormandie.fr/economie-et-amenagements/amenagements/plan-local-durbanisme-intercommunal-hd/",
      },
    },
    depot: {
      texte:
        "Les demandes se déposent auprès de la mairie d'Évreux, en ligne ou sur papier ; la Ville détaille les pièces et le circuit sur sa page consacrée aux autorisations d'urbanisme.",
      source: { label: "Ville d'Évreux, autorisations d'urbanisme", url: "https://www.evreux.fr/demarches/autorisations-durbanisme/" },
    },
    risques: [
      {
        texte:
          "L'Eure compte environ 8 000 marnières recensées. La doctrine de l'État y écarte toute construction nouvelle dans le périmètre de risque d'une cavité tant que le doute n'est pas levé.",
        source: EURE_CAVITES,
      },
      {
        texte: "En vallée de l'Iton, le plan de prévention des risques d'inondation d'Évreux encadre les constructions en zone inondable.",
        source: {
          label: "Préfecture de l'Eure, PPRI d'Évreux",
          url: "https://www.eure.gouv.fr/Actions-de-l-Etat/Risques-majeurs/Risques-naturels/Inondations/Les-plans-de-prevention-du-risque-d-inondation-PPRI/PPRI-Evreux",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "L'aire de mise en valeur de l'architecture et du patrimoine d'Évreux, approuvée fin 2024, vaut site patrimonial remarquable, et un périmètre délimité remplace le rayon de 500 m autour de la cathédrale : avis de l'Architecte des Bâtiments de France et instruction en 3 mois dans ces secteurs.",
        source: {
          label: "Évreux Portes de Normandie, AVAP",
          url: "https://www.evreuxportesdenormandie.fr/economie-et-amenagements/aire-de-valorisation-de-larchitecture-et-du-patrimoine/",
        },
      },
    ],
    architecture: {
      texte:
        "Dans le centre (zone UA), le règlement du PLUi interdit les tuiles claires ou à ondulation, étrangères aux toitures normandes, et demande des toits-terrasses végétalisés à 80 %.",
      source: {
        label: "Règlement du PLUi-HD d'Évreux Portes de Normandie",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_200071454/a6fbfbeae54ed7ebedac6b77091d0fb7/200071454_reglement_20251216.pdf",
      },
    },
    communesVoisines: ["Guichainville", "Saint-Sébastien-de-Morsent", "Gravigny", "Arnières-sur-Iton"],
    faq: [
      {
        q: "Comment savoir si une marnière menace mon terrain ?",
        a: "Les cavités connues sont recensées dans l'atlas départemental et prises en compte par le PLUi. Nous vérifions la parcelle avant de chiffrer ; si un périmètre de risque la touche, une étude de levée de doute est le préalable au dépôt.",
      },
      {
        q: "Quel délai pour un permis de maison à Évreux ?",
        a: "Deux mois à compter du dépôt d'un dossier complet, trois dans le site patrimonial remarquable ou aux abords de la cathédrale, où l'Architecte des Bâtiments de France donne son avis.",
      },
    ],
  },
  {
    slug: "dieppe",
    nom: "Dieppe",
    a: "à Dieppe",
    autour: "autour de Dieppe",
    departement: "76",
    intercommunalite: "la communauté d'agglomération de la Région dieppoise (Dieppe-Maritime)",
    description:
      "Permis de construire de maison à Dieppe : PLU communal, vallée de l'Arques, recul des falaises, secteur protégé. Maître d'œuvre normand, prix fixe.",
    accroche:
      "À Dieppe, la falaise recule et la vallée de l'Arques déborde : avant la façade, on regarde la carte. Le recul du trait de côte y entre désormais dans les règles d'urbanisme.",
    urbanisme: {
      texte:
        "Dieppe a son propre PLU, approuvé en 2014, dont la révision générale a été lancée en 2022. Au moment de déposer, nous vérifions quelle version s'applique.",
      source: { label: "Géoportail de l'urbanisme, PLU de Dieppe", url: "https://www.geoportail-urbanisme.gouv.fr/document/by-id/0f84b292d6f8f9482ecaedc2cca2d3a8" },
    },
    depot: {
      texte:
        "C'est la Ville qui instruit. Dépôt en ligne depuis 2022, ou au service urbanisme, boulevard de Verdun ; la Ville rappelle elle-même le délai de 2 mois, porté à 3 en secteur protégé.",
      source: {
        label: "Ville de Dieppe, autorisations d'urbanisme dématérialisées",
        url: "https://mobile.dieppe.fr/pages/autorisations-d-urbanisme-dematerialisees-66d98dc2-6774-4aba-999c-d179ef34000c",
      },
    },
    risques: [
      {
        texte:
          "Le plan de prévention des risques littoraux et d'inondation de la vallée de l'Arques, approuvé en 2022, couvre la submersion marine, les débordements, le ruissellement et les remontées de nappe, à Dieppe, Arques-la-Bataille, Martin-Église et Rouxmesnil-Bouteilles.",
        source: {
          label: "Préfecture de Seine-Maritime, PPRLi de la vallée de l'Arques",
          url: "https://www.seine-maritime.gouv.fr/Actions-de-l-Etat/Environnement-et-prevention-des-risques/Enquetes-publiques-et-Consultations-du-public/Enquetes-publiques/PPRN-Plan-de-Prevention-des-Risques-Naturels/PPRLi-de-la-Vallee-de-l-Arques/Approbation",
        },
      },
      {
        texte:
          "Dieppe fait partie des communes de Seine-Maritime engagées dans l'adaptation au recul du trait de côte : près des falaises, une cartographie à 30 et 100 ans encadre la constructibilité.",
        source: {
          label: "Préfecture de Seine-Maritime, recul du trait de côte et urbanisme",
          url: "https://www.seine-maritime.gouv.fr/Actions-de-l-Etat/Environnement-et-prevention-des-risques/Risques-technologiques-et-naturels/Etude-sur-le-recul-du-trait-de-cote/Traduction-du-recul-du-trait-de-cote-en-urbanisme",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Une partie de la ville est en secteur protégé, où l'Architecte des Bâtiments de France donne son avis : la Ville rappelle que le délai d'instruction y passe de 2 à 3 mois.",
        source: {
          label: "Ville de Dieppe, autorisations d'urbanisme",
          url: "https://mobile.dieppe.fr/pages/autorisations-d-urbanisme-dematerialisees-66d98dc2-6774-4aba-999c-d179ef34000c",
        },
      },
    ],
    architecture: {
      texte:
        "En pays de Caux, le CAUE de Seine-Maritime recommande brique, silex et toitures à deux pans pentus (40 à 50°) en ardoise ou en terre cuite : des recommandations, que le PLU traduit ou non selon les secteurs.",
      source: {
        label: "CAUE 76, guide de la maison individuelle en Seine-Maritime",
        url: "https://www.culture.gouv.fr/content/download/262637/file/Guide%20construction%20maisons%20individuelles%2076-%20BD.pdf?inLanguage=fre-FR",
      },
    },
    communesVoisines: ["Hautot-sur-Mer", "Offranville", "Martin-Église", "Arques-la-Bataille"],
    faq: [
      {
        q: "Peut-on encore construire près des falaises ?",
        a: "Cela dépend de la cartographie du recul du trait de côte et du PLU. Nous vérifions la position du terrain avant tout dessin : un projet dans une zone d'érosion à 30 ans n'a pas les mêmes possibilités qu'un terrain en retrait.",
      },
      {
        q: "Qui instruit mon permis à Dieppe ?",
        a: "La Ville de Dieppe. Le dépôt se fait en ligne ou au service urbanisme ; nous nous chargeons du dépôt dans les formules Complet et Premium.",
      },
    ],
  },
  {
    slug: "alencon",
    nom: "Alençon",
    a: "à Alençon",
    autour: "autour d'Alençon",
    departement: "61",
    intercommunalite: "la communauté urbaine d'Alençon, à cheval sur l'Orne et la Sarthe",
    description:
      "Permis de construire de maison à Alençon : PLU communautaire, PPRI de la Sarthe, site patrimonial remarquable. Dossier PCMI complet, à prix fixe.",
    accroche:
      "À Alençon, un même document d'urbanisme s'applique de part et d'autre de la limite entre l'Orne et la Sarthe : qu'il soit à Damigny ou de l'autre côté de la limite départementale, un terrain de la communauté urbaine se lit avec le même règlement.",
    urbanisme: {
      texte:
        "Le PLU communautaire de la communauté urbaine d'Alençon, approuvé en 2020 et révisé en 2023, couvre Alençon et les communes voisines, dans l'Orne comme dans la Sarthe. Une nouvelle révision est engagée.",
      source: { label: "Communauté urbaine d'Alençon, PLU communautaire", url: "https://www.cu-alencon.fr/services/urbanisme/plan-local-urbanisme-communautaire/" },
    },
    depot: {
      texte: "Dépôt en ligne sur le guichet numérique de la communauté urbaine ; le dépôt papier reste possible pour les particuliers.",
      source: { label: "Communauté urbaine d'Alençon, questions fréquentes", url: "https://www.cu-alencon.fr/foire-aux-questions/" },
    },
    risques: [
      {
        texte:
          "Le plan de prévention des risques d'inondation de la Sarthe concerne 14 communes de la communauté urbaine, dont Alençon ; sa révision est à l'étude.",
        source: { label: "Communauté urbaine d'Alençon, PPRI", url: "https://www.cu-alencon.fr/services/urbanisme/plan-de-prevention-du-risque-inondation/" },
      },
    ],
    patrimoine: [
      {
        texte:
          "Le centre historique, qui réunit une trentaine de monuments historiques, est classé site patrimonial remarquable depuis 2021 : avis de l'Architecte des Bâtiments de France et instruction en 3 mois dans ce périmètre.",
        source: {
          label: "DRAC Normandie, site patrimonial remarquable d'Alençon",
          url: "https://www.culture.gouv.fr/regions/drac-normandie/actualites/Classement-au-titre-de-site-patrimonial-remarquable-d-Alencon",
        },
      },
    ],
    communesVoisines: ["Saint-Germain-du-Corbéis", "Damigny", "Valframbert", "Cerisé"],
    faq: [
      {
        q: "Mon terrain est dans la Sarthe : les règles sont-elles différentes ?",
        a: "Pas pour le document d'urbanisme : le PLU communautaire s'applique aux communes de la communauté urbaine des deux départements. Les services de l'État et les plans de prévention, eux, peuvent dépendre du département.",
      },
      {
        q: "Quel délai pour un permis de maison à Alençon ?",
        a: "Deux mois à compter du dépôt d'un dossier complet, trois dans le site patrimonial remarquable du centre historique.",
      },
    ],
  },
  {
    slug: "vernon",
    nom: "Vernon",
    a: "à Vernon",
    autour: "autour de Vernon",
    departement: "27",
    intercommunalite: "Seine Normandie Agglomération",
    description:
      "Permis de construire de maison à Vernon : PLU communal, nouveau PPRI de la Seine, marnières, proximité de Giverny. Maître d'œuvre normand, prix fixe.",
    accroche:
      "Vernon vit au rythme de la Seine : le plan de prévention des inondations de la Seine dans l'Eure a été renouvelé début 2026, et Giverny, de l'autre côté du fleuve, impose sa propre exigence patrimoniale.",
    urbanisme: {
      texte: "Vernon applique son propre PLU, approuvé en 2016 et ajusté depuis par plusieurs procédures de révision allégée et de modification.",
      source: { label: "Ville de Vernon, PLU en vigueur", url: "https://www.vernon27.fr/vie-pratique/urbanisme/plu-en-vigueur/" },
    },
    depot: {
      texte: "Vernon a ouvert un guichet numérique unique pour les démarches d'urbanisme, qui permet de déposer un permis en ligne.",
      source: {
        label: "Ville de Vernon, guichet numérique d'urbanisme",
        url: "https://www.vernon27.fr/actualites/vernon-lance-son-guichet-numerique-unique-pour-les-demarches-durbanisme/",
      },
    },
    risques: [
      {
        texte:
          "Le plan de prévention des risques d'inondation de la Seine dans l'Eure, approuvé début 2026, couvre 21 communes, dont Vernon, Giverny et Saint-Marcel.",
        source: {
          label: "Préfecture de l'Eure, PPRI de la Seine euroise",
          url: "https://www.eure.gouv.fr/Actions-de-l-Etat/Risques-majeurs/Risques-naturels/Inondations/Les-plans-de-prevention-du-risque-d-inondation-PPRI/PPRI-de-la-Seine-euroise",
        },
      },
      {
        texte:
          "Comme partout dans l'Eure, les marnières (anciennes carrières de craie) imposent de vérifier le terrain : une cavité recensée à proximité peut bloquer un permis.",
        source: EURE_CAVITES,
      },
    ],
    patrimoine: [
      {
        texte:
          "Vernon n'est pas un site patrimonial remarquable, mais Giverny, sa voisine, en est un et constitue un site classé : tout projet y relève de l'Architecte des Bâtiments de France.",
        source: {
          label: "Préfecture de l'Eure, sites patrimoniaux remarquables",
          url: "https://www.eure.gouv.fr/Actions-de-l-Etat/Patrimoine/Les-SPR-ex-ZPPAUP-et-ex-AVAP",
        },
      },
    ],
    communesVoisines: ["Saint-Marcel", "Saint-Just", "La Chapelle-Longueville"],
    faq: [
      {
        q: "Mon terrain est-il en zone inondable ?",
        a: "Le nouveau PPRI de la Seine euroise délimite les zones réglementées. Nous le croisons avec le PLU avant de chiffrer : en zone d'aléa, la hauteur du plancher et l'emprise peuvent être encadrées.",
      },
      {
        q: "Et si je construis à Giverny ?",
        a: "Giverny est un site patrimonial remarquable et un site classé : l'avis de l'Architecte des Bâtiments de France y est systématique et l'instruction plus longue. Nous adaptons le dossier, notamment l'insertion PCMI 6.",
      },
    ],
  },
  {
    slug: "lisieux",
    nom: "Lisieux",
    a: "à Lisieux",
    autour: "autour de Lisieux",
    departement: "14",
    intercommunalite: "l'agglomération Lisieux Normandie",
    description:
      "Permis de construire de maison à Lisieux : PLUi, PPRI de la Touques et de l'Orbiquet, abords de la cathédrale. Dossier PCMI complet, prix fixe.",
    accroche:
      "Au cœur du Pays d'Auge, Lisieux s'est construite au confluent de la Touques et de l'Orbiquet : les fonds de vallée s'y lisent avec le plan d'inondation, les hauteurs avec l'œil de la cathédrale.",
    urbanisme: {
      texte:
        "À Lisieux s'applique le PLUi de l'ancienne intercommunalité Lisieux Pays d'Auge Normandie, approuvé fin 2016 et ajusté depuis par plusieurs révisions allégées et modifications.",
      source: { label: "Géoportail de l'urbanisme, PLUi de Lisieux", url: "https://www.geoportail-urbanisme.gouv.fr/document/by-id/ffbbe62d375534d04aa5185f9a92cc58" },
    },
    depot: {
      texte:
        "Dépôt sur le guichet unique de l'agglomération ; la mairie reste le guichet d'accueil et l'instruction est assurée par le service Conseil et droit des sols de Lisieux Normandie.",
      source: { label: "Lisieux Normandie, guichet unique", url: "https://www.lisieux-normandie.fr/au-quotidien/urbanisme/guichet-unique/" },
    },
    risques: [
      {
        texte:
          "Le plan de prévention des risques d'inondation de la Touques moyenne et de l'Orbiquet, approuvé en 2010, couvre 13 communes, dont Lisieux, Saint-Désir, Glos et Beuvillers.",
        source: {
          label: "Préfecture du Calvados, PPRI de la Touques moyenne et de l'Orbiquet",
          url: "https://www.calvados.gouv.fr/Actions-de-l-Etat/Environnement.-risques-naturels-et-technologiques/Prevention-des-risques/Plans-de-Prevention-des-risques/Accedez-aux-plans-de-prevention-des-risques-du-Calvados/Le-PPRi-de-la-Touques-moyenne-et-de-l-Orbiquet",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Lisieux n'est pas un site patrimonial remarquable, mais ses monuments historiques, comme la cathédrale Saint-Pierre, créent des périmètres d'abords : l'Architecte des Bâtiments de France y donne son avis et l'instruction passe à 3 mois.",
        source: {
          label: "DRAC Normandie, espaces protégés du Calvados",
          url: "https://www.culture.gouv.fr/regions/drac-normandie/aides-et-demarches/aides-et-demarches-pour-les-patrimoines-et-l-architecture/les-espaces-proteges-dans-le-calvados2",
        },
      },
    ],
    communesVoisines: ["Saint-Désir", "Glos", "Beuvillers", "Saint-Martin-de-la-Lieue"],
    faq: [
      {
        q: "Mon terrain est-il en zone inondable ?",
        a: "Les fonds de vallée de la Touques et de l'Orbiquet sont couverts par un plan de prévention. Nous le vérifions avant de chiffrer : en zone réglementée, l'implantation et la hauteur du plancher peuvent être imposées.",
      },
      {
        q: "Les colombages sont-ils obligatoires ?",
        a: "Non, pas en règle générale : c'est le PLUi qui fixe l'aspect extérieur, zone par zone. Aux abords d'un monument historique, l'Architecte des Bâtiments de France peut demander une insertion plus soignée.",
      },
    ],
  },
  {
    slug: "saint-lo",
    nom: "Saint-Lô",
    a: "à Saint-Lô",
    autour: "autour de Saint-Lô",
    departement: "50",
    intercommunalite: "Saint-Lô Agglo",
    description:
      "Permis de construire de maison à Saint-Lô : premier PLUi de la Manche, PPRI de la Vire, patrimoine de la Reconstruction. Maître d'œuvre normand, prix fixe.",
    accroche:
      "Saint-Lô a été la première de la Manche à se doter d'un PLUi, en 2024 : 61 communes, un seul règlement. Pour un terrain à Agneaux ou à Saint-Georges-Montcocq, les règles sont désormais les mêmes qu'en ville.",
    urbanisme: {
      texte:
        "Saint-Lô Agglo a approuvé en octobre 2024 le premier PLUi de la Manche : il couvre 61 communes et remplace les anciens PLU et cartes communales. Une première modification a été approuvée en janvier 2026.",
      source: {
        label: "Saint-Lô Agglo, conseil communautaire du 14 octobre 2024",
        url: "https://www.saint-lo-agglo.fr/fr/actualites/retour-sur-le-conseil-communautaire-du-14-octobre-2024",
      },
    },
    depot: {
      texte: "Dépôt en ligne sur le guichet unique de Saint-Lô Agglo, ouvert depuis 2022 ; l'instruction est assurée par le service d'urbanisme de l'agglomération.",
      source: { label: "Saint-Lô Agglo, autorisations d'urbanisme", url: "https://www.saint-lo-agglo.fr/fr/autorisations-durbanisme" },
    },
    risques: [
      {
        texte: "Le plan de prévention des risques d'inondation de la Vire, approuvé en 2004, s'applique notamment à Saint-Lô, Agneaux et Canisy.",
        source: {
          label: "Préfecture de la Manche, PPRI de la Vire",
          url: "https://www.manche.gouv.fr/Politiques-publiques/Environnement-risques-naturels-et-technologiques/Plans-de-prevention-des-risques/Plans-de-Prevention-des-Risques-naturels-PPRN/PPRN-approuves/Plans-de-Prevention-des-Risques-d-Inondation-PPRI/PPRI-de-la-Vire",
        },
      },
    ],
    patrimoine: [
      {
        texte:
          "Ville reconstruite après 1944, Saint-Lô compte plusieurs bâtiments de la Reconstruction protégés au titre des monuments historiques, dont l'hôtel de ville, le beffroi, la halle et le théâtre : à leurs abords, l'Architecte des Bâtiments de France donne son avis.",
        source: {
          label: "France 3 Normandie, nouveaux monuments historiques à Saint-Lô",
          url: "https://france3-regions.franceinfo.fr/normandie/manche/saint-lo/saint-lo-cinq-nouveaux-batiments-classes-aux-monuments-historiques-1547226.html",
        },
      },
    ],
    architecture: {
      texte:
        "Le règlement du PLUi interdit les teintes claires et les matériaux brillants en toiture, et demande que les extensions et annexes reprennent les teintes de l'existant.",
      source: { label: "Règlement du PLUi de Saint-Lô Agglo", url: "https://www.saint-amand-villages.fr/wp-content/uploads/2025/03/Reglement-PLUI.pdf" },
    },
    communesVoisines: ["Agneaux", "Saint-Georges-Montcocq", "Baudre", "Canisy"],
    faq: [
      {
        q: "Mon ancien PLU communal s'applique-t-il encore ?",
        a: "Non : depuis octobre 2024, le PLUi de Saint-Lô Agglo remplace les PLU et cartes communales des 61 communes. Un terrain constructible hier ne l'est pas forcément aujourd'hui, et inversement : nous vérifions le zonage actuel avant de chiffrer.",
      },
      {
        q: "Quel délai pour un permis de maison à Saint-Lô ?",
        a: "Deux mois à compter du dépôt d'un dossier complet, trois aux abords des monuments historiques de la Reconstruction, où l'Architecte des Bâtiments de France donne son avis.",
      },
    ],
  },
];

/** Questions de la page Normandie. */
export const faqNormandie: { q: string; a: string }[] = [
  {
    q: "Intervenez-vous partout en Normandie ?",
    a: "Oui, dans les cinq départements. Le bureau est au Havre : nous travaillons sur plans, cadastre et photos, avec rendez-vous au bureau ou en visio, et nous nous déplaçons en Normandie quand le projet le demande.",
  },
  {
    q: "Le prix change-t-il selon la commune ?",
    a: "Non. Les formules sont à prix fixe jusqu'à 149 m² de surface de plancher, où que se trouve le terrain. Seules des options (étude des eaux pluviales, rendu 3D supplémentaire) peuvent s'ajouter, toujours annoncées dans le devis.",
  },
  {
    q: "Quel est le délai d'instruction d'un permis de maison ?",
    a: "Deux mois à compter du dépôt d'un dossier complet. Un mois de plus dans un site patrimonial remarquable ou aux abords d'un monument historique, où l'Architecte des Bâtiments de France donne son avis.",
  },
  {
    q: "Qu'est-ce qu'une marnière, et pourquoi en parle-t-on tant ?",
    a: "Une ancienne carrière souterraine de craie, creusée autrefois pour amender les champs. Elles sont nombreuses en Seine-Maritime et dans l'Eure ; autour d'un indice de marnière, un périmètre de risque peut interdire de construire tant qu'une étude n'a pas levé le doute.",
  },
];
