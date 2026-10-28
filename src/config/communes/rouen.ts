import type { Fait, Reperes, Source, Ville } from "../normandie";
import { REVUE, catastrophesNaturelles, cavitesRecensees } from "./commun";
import { REPERES } from "./reperes";

/** Agglomération de Rouen : plateaux nord et est. */

const METROPOLE_ROUEN = "la Métropole Rouen Normandie, qui regroupe 71 communes";

const PLU_METROPOLITAIN: Source = {
  label: "Métropole Rouen Normandie, PLU métropolitain",
  url: "https://www.metropole-rouen-normandie.fr/urbanisme/consulter-le-plan-local-durbanisme-metropolitain",
};
const PPRI_CAILLY: Source = {
  label: "Géorisques, PPRi Cailly, Aubette et Robec",
  url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/76DDTM20110001",
};
const PEB_ROUEN_BOOS: Source = {
  label: "Plan d'exposition au bruit de l'aérodrome de Rouen-Boos, arrêté du 17 décembre 1991",
  url: "https://piece-jointe-carto.developpement-durable.gouv.fr/NAT003/PEB/PEB_LFOP_17_12_1991.pdf",
};

function pluMetropolitain(nom: string): Fait {
  return {
    texte: `${nom} applique le PLU métropolitain, approuvé le 13 février 2020 et en cours de révision générale.`,
    source: PLU_METROPOLITAIN,
  };
}

function ppriCailly(nom: string): Fait {
  return {
    texte: `${nom} est couverte par le PPRi des bassins versants du Cailly, de l'Aubette et du Robec (2022), qui réglemente aussi le ruissellement.`,
    source: PPRI_CAILLY,
  };
}

/** Réponse chiffrée : la part d'indices d'origine indéterminée est ce qui bloque le plus de permis. */
const faqMarniere = (a: string, r: Reperes) => ({
  q: `Mon terrain ${a} est-il concerné par une marnière ?`,
  a: `Sur les ${r.cavites.total} indices recensés ${a}, ${r.cavites.indeterminees} sont d'origine indéterminée et ${r.cavites.carrieres} sont d'anciennes carrières. Une marnière rend inconstructible un rayon de 60 m : à vérifier avant d'acheter.`,
});

export const communesRouen: Ville[] = [
  {
    slug: "isneauville",
    nom: "Isneauville",
    a: "à Isneauville",
    autour: "autour d'Isneauville",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76377"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Isneauville : PLU métropolitain, 191 indices de cavités, PPRi du Cailly. Dossier complet à prix fixe, maître d'œuvre normand.",
    accroche:
      "Sur le plateau au nord-est de Rouen, traversé par l'A28, Isneauville compte 191 indices de cavités souterraines recensés : c'est la première chose que nous vérifions sur un terrain.",
    urbanisme: pluMetropolitain("Isneauville"),
    depot: {
      texte:
        "Dépôt en ligne sur le guichet numérique des autorisations d'urbanisme de la Métropole, auquel renvoie le site de la commune, ou sur papier en mairie. L'instruction est menée par les services de la Métropole.",
      source: { label: "Ville d'Isneauville, guichet numérique des autorisations d'urbanisme", url: "https://www.isneauville.fr/guichet-numerique-des-autorisations-durbanisme-gnau/" },
    },
    risques: [cavitesRecensees("Isneauville", REPERES["76377"]), ppriCailly("Isneauville"), catastrophesNaturelles("Isneauville", REPERES["76377"])],
    patrimoine: [],
    architecture: {
      texte:
        "Les dossiers sont d'abord examinés en mairie avec l'architecte conseil du CAUE, qui tient une permanence sur rendez-vous un mardi après-midi sur deux : un avis utile avant de figer les façades.",
      source: { label: "Ville d'Isneauville, projets d'urbanisme", url: "https://www.isneauville.fr/projets-durbanisme/" },
    },
    communesVoisines: ["Quincampoix", "Houppeville", "Fontaine-sous-Préaux", "Bois-Guillaume", "Saint-Martin-du-Vivier"],
    faq: [
      faqMarniere("à Isneauville", REPERES["76377"]),
      {
        q: "Où déposer mon permis à Isneauville ?",
        a: "En ligne sur le guichet numérique de la Métropole Rouen Normandie, ou sur papier en mairie. Avec nos formules Complet et Premium, nous nous chargeons du dépôt et des échanges avec le service instructeur.",
      },
      {
        q: "Quel délai pour un permis de maison à Isneauville ?",
        a: "Deux mois à compter du dépôt d'un dossier complet. Aucun monument historique n'est protégé sur la commune ; vérifiez toutefois que votre terrain n'est pas aux abords d'un monument d'une commune voisine, ce qui ajouterait un mois.",
      },
    ],
  },
  {
    slug: "bois-guillaume",
    nom: "Bois-Guillaume",
    a: "à Bois-Guillaume",
    autour: "autour de Bois-Guillaume",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76108"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Bois-Guillaume : PLU métropolitain, 142 indices de cavités, ferme du Colombier protégée. Dossier PCMI complet à prix fixe.",
    accroche:
      "Limitrophe de Rouen sur le plateau nord, Bois-Guillaume compte plus de 14 500 habitants et 142 indices de cavités recensés : les terrains y sont rares, et chacun mérite une lecture attentive du sous-sol.",
    urbanisme: pluMetropolitain("Bois-Guillaume"),
    depot: {
      texte:
        "Les demandes peuvent se faire en ligne depuis la page urbanisme de la ville ; au service urbanisme de la mairie, place de la Libération, les dépôts se font uniquement sur rendez-vous.",
      source: { label: "Ville de Bois-Guillaume, autorisations d'urbanisme", url: "https://www.ville-bois-guillaume.fr/habiter/autorisations-durbanisme/" },
    },
    risques: [cavitesRecensees("Bois-Guillaume", REPERES["76108"]), ppriCailly("Bois-Guillaume")],
    patrimoine: [
      {
        texte:
          "Les façades et toitures de la maison d'habitation de la ferme du Colombier, et deux cheminées, sont inscrites aux monuments historiques depuis 1978 : à ses abords, l'Architecte des Bâtiments de France donne son avis et l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, ferme du Colombier (PA00100563)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00100563" },
      },
      catastrophesNaturelles("Bois-Guillaume", REPERES["76108"]),
    ],
    architecture: {
      texte:
        "Avant de déposer, l'architecte conseil du CAUE reçoit au service urbanisme deux mercredis après-midi par mois, uniquement sur rendez-vous.",
      source: { label: "Ville de Bois-Guillaume, autorisations d'urbanisme", url: "https://www.ville-bois-guillaume.fr/habiter/autorisations-durbanisme/" },
    },
    communesVoisines: ["Rouen", "Bihorel", "Mont-Saint-Aignan", "Houppeville", "Isneauville", "Saint-Martin-du-Vivier"],
    faq: [
      faqMarniere("à Bois-Guillaume", REPERES["76108"]),
      {
        q: "Faut-il prendre rendez-vous pour déposer en mairie ?",
        a: "Oui : à Bois-Guillaume, le service urbanisme ne reçoit les dépôts que sur rendez-vous. Avec nos formules Complet et Premium, nous préparons le dossier et nous chargeons du dépôt et du suivi.",
      },
      {
        q: "Quel délai pour un permis de maison à Bois-Guillaume ?",
        a: "Deux mois à compter du dépôt d'un dossier complet, trois mois si le terrain est aux abords de la ferme du Colombier, protégée au titre des monuments historiques.",
      },
    ],
  },
  {
    slug: "quincampoix",
    nom: "Quincampoix",
    a: "à Quincampoix",
    autour: "autour de Quincampoix",
    departement: "76",
    intercommunalite: "la communauté de communes Inter Caux Vexin, et non de la Métropole de Rouen",
    pole: "rouen",
    reperes: REPERES["76517"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Quincampoix : PLU communal révisé en 2022, assainissement, PPRi du Cailly. Dossier complet à prix fixe, maître d'œuvre normand.",
    accroche:
      "Juste au-delà de la Métropole, de part et d'autre de l'A28, Quincampoix dépend de la communauté de communes Inter Caux Vexin : son règlement d'urbanisme n'est pas celui de Rouen.",
    urbanisme: {
      texte:
        "Quincampoix reste couverte par son PLU communal, approuvé le 7 octobre 2013 ; sa révision allégée n° 1 a été approuvée par le conseil communautaire d'Inter Caux Vexin le 28 mars 2022.",
      source: {
        label: "Géoportail de l'urbanisme, PLU de Quincampoix (révision allégée 2022)",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_76517/c90449084ccfb56a27a00ac7d7e31cd1/76517_procedure_20220328.pdf",
      },
    },
    depot: {
      texte:
        "Dépôt en ligne sur le guichet numérique de la communauté de communes Inter Caux Vexin, ou sur papier en mairie, en main propre ou par courrier. Un dossier envoyé par courriel n'est pas traité.",
      source: { label: "Mairie de Quincampoix, déposer un dossier d'urbanisme", url: "https://www.mairie-quincampoix.fr/la-mairie/urbanisme/deposer-un-dossier-durbanisme/" },
    },
    risques: [
      ppriCailly("Quincampoix"),
      {
        texte:
          "D'après les annexes sanitaires du PLU, l'assainissement collectif ne dessert que le centre-bourg et le hameau de la Muette : ailleurs, le projet doit prévoir un assainissement individuel, à dimensionner dès le permis.",
        source: {
          label: "Géoportail de l'urbanisme, PLU de Quincampoix, notice",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76517/c90449084ccfb56a27a00ac7d7e31cd1/76517_notice_20220328.pdf",
        },
      },
      catastrophesNaturelles("Quincampoix", REPERES["76517"]),
    ],
    patrimoine: [],
    communesVoisines: ["Isneauville", "Saint-Georges-sur-Fontaine", "Préaux", "Saint-André-sur-Cailly", "Bosc-Guérard-Saint-Adrien"],
    faq: [
      {
        q: "Le PLU de Rouen s'applique-t-il à Quincampoix ?",
        a: "Non. Quincampoix ne fait pas partie de la Métropole Rouen Normandie : c'est son PLU communal, révisé en 2022, qui s'applique. Un PLUi d'Inter Caux Vexin est en cours d'élaboration ; nous vérifions le règlement en vigueur à la date de votre dépôt.",
      },
      {
        q: "Mon terrain est-il raccordé au tout-à-l'égout ?",
        a: "Seuls le centre-bourg et le hameau de la Muette sont en assainissement collectif d'après le PLU. Hors de ces secteurs, le dossier doit intégrer un assainissement individuel ; nous le prévoyons sur le plan de masse.",
      },
    ],
  },
  {
    slug: "houppeville",
    nom: "Houppeville",
    a: "à Houppeville",
    autour: "autour d'Houppeville",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76367"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Houppeville : PLU métropolitain, 97 indices de cavités, église classée. Dossier complet à prix fixe, maître d'œuvre normand.",
    accroche:
      "Entre la vallée du Cailly et le plateau de Bois-Guillaume, en lisière de la forêt Verte, Houppeville compte 97 indices de cavités recensés et une église classée monument historique.",
    urbanisme: pluMetropolitain("Houppeville"),
    depot: {
      texte:
        "Le dossier se dépose en mairie, rue Jean Jaurès : le service urbanisme le reçoit puis le transmet pour instruction au service urbanisme de la Métropole Rouen Normandie.",
      source: { label: "Ville d'Houppeville, urbanisme", url: "https://www.houppeville.fr/vie-locale/urbanisme" },
    },
    risques: [
      cavitesRecensees("Houppeville", REPERES["76367"]),
      ppriCailly("Houppeville"),
      catastrophesNaturelles("Houppeville", REPERES["76367"]),
    ],
    patrimoine: [
      {
        texte:
          "L'église Notre-Dame-de-l'Assomption est classée monument historique depuis 1862 : à ses abords, l'Architecte des Bâtiments de France donne son avis sur le projet et l'instruction passe de 2 à 3 mois.",
        source: { label: "Base Mérimée, église Notre-Dame-de-l'Assomption (PA00100723)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00100723" },
      },
    ],
    communesVoisines: ["Notre-Dame-de-Bondeville", "Malaunay", "Le Houlme", "Bois-Guillaume", "Isneauville"],
    faq: [
      faqMarniere("à Houppeville", REPERES["76367"]),
      {
        q: "Mon terrain est-il aux abords de l'église ?",
        a: "Si votre terrain est dans le périmètre d'abords de l'église Notre-Dame-de-l'Assomption, l'Architecte des Bâtiments de France donne son avis et l'instruction prend 3 mois. Nous le vérifions sur l'atlas des patrimoines avant de dessiner.",
      },
    ],
  },
  {
    slug: "franqueville-saint-pierre",
    nom: "Franqueville-Saint-Pierre",
    a: "à Franqueville-Saint-Pierre",
    autour: "autour de Franqueville-Saint-Pierre",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76475"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Franqueville-Saint-Pierre : PLU métropolitain, 99 indices de cavités, bruit de l'aéroport. Dossier complet à prix fixe.",
    accroche:
      "Sur le plateau est de Rouen, entre Le Mesnil-Esnard et Boos, Franqueville-Saint-Pierre compte 99 indices de cavités, dont 37 anciennes carrières, et voisine l'aéroport de Rouen.",
    urbanisme: pluMetropolitain("Franqueville-Saint-Pierre"),
    depot: {
      texte:
        "Les demandes se déposent et se suivent sur le guichet numérique de la Métropole Rouen Normandie ; les particuliers peuvent encore déposer sur papier, mais l'instruction est dématérialisée.",
      source: { label: "Ville de Franqueville-Saint-Pierre, urbanisme", url: "https://www.franquevillesaintpierre.com/urbanisme" },
    },
    risques: [
      cavitesRecensees("Franqueville-Saint-Pierre", REPERES["76475"]),
      {
        texte:
          "La commune fait partie des cinq communes concernées par le plan d'exposition au bruit de l'aéroport de Rouen-Boos, approuvé en 1991 : selon la zone où se trouve le terrain, la construction de logements peut y être limitée.",
        source: PEB_ROUEN_BOOS,
      },
      ppriCailly("Franqueville-Saint-Pierre"),
      catastrophesNaturelles("Franqueville-Saint-Pierre", REPERES["76475"]),
    ],
    patrimoine: [],
    communesVoisines: ["Le Mesnil-Esnard", "Boos", "Saint-Aubin-Épinay", "Belbeuf", "Saint-Aubin-Celloville"],
    faq: [
      faqMarniere("à Franqueville-Saint-Pierre", REPERES["76475"]),
      {
        q: "Le bruit de l'aéroport empêche-t-il de construire ?",
        a: "Pas sur toute la commune. Le plan d'exposition au bruit découpe des zones, et seules certaines restreignent les logements. Nous situons votre parcelle sur ce plan avant de chiffrer.",
      },
    ],
  },
  {
    slug: "boos",
    nom: "Boos",
    a: "à Boos",
    autour: "autour de Boos",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76116"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Boos : PLU métropolitain, 159 indices de cavités, bruit de l'aéroport, colombier classé. Dossier PCMI complet à prix fixe.",
    accroche:
      "Sur le plateau est, Boos accueille l'essentiel de l'aéroport de Rouen Vallée de Seine et le colombier des abbesses de Saint-Amand : bruit, patrimoine et 159 indices de cavités sont à regarder avant de dessiner.",
    urbanisme: pluMetropolitain("Boos"),
    depot: {
      texte:
        "Les permis de construire de maison individuelle peuvent être déposés en ligne sur le guichet numérique de la Métropole Rouen Normandie, vers lequel renvoie le site de la mairie, ou sur papier en mairie.",
      source: { label: "Mairie de Boos, guichet numérique des autorisations d'urbanisme", url: "https://www.mairie-boos.com/urbanisme/guichet-numerique-des-autorisations-durbanisme-gnau/" },
    },
    risques: [
      cavitesRecensees("Boos", REPERES["76116"]),
      {
        texte:
          "Boos est couverte par le plan d'exposition au bruit de l'aéroport de Rouen-Boos, approuvé par arrêté préfectoral du 17 décembre 1991 : la zone de bruit dans laquelle se trouve le terrain conditionne le projet.",
        source: PEB_ROUEN_BOOS,
      },
      ppriCailly("Boos"),
      catastrophesNaturelles("Boos", REPERES["76116"]),
    ],
    patrimoine: [
      {
        texte:
          "Le colombier de l'ancien manoir des abbesses de Saint-Amand, au décor attribué à Masséot Abaquesne, est classé monument historique depuis 1889 ; le logis, la grange dîmière et les murs d'enclos sont inscrits. À leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, manoir des abbesses de Saint-Amand (PA00100574)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00100574" },
      },
    ],
    communesVoisines: ["Franqueville-Saint-Pierre", "La Neuville-Chant-d'Oisel", "Quévreville-la-Poterie", "Saint-Aubin-Celloville", "Montmain"],
    faq: [
      faqMarniere("à Boos", REPERES["76116"]),
      {
        q: "Peut-on construire près de l'aéroport ?",
        a: "Cela dépend de la zone du plan d'exposition au bruit où se trouve le terrain : certaines zones restreignent fortement les logements, d'autres imposent surtout une isolation acoustique. Nous vérifions la zone de votre parcelle avant de chiffrer.",
      },
      {
        q: "Quel délai pour un permis de maison à Boos ?",
        a: "Deux mois à compter du dépôt d'un dossier complet, trois mois aux abords du colombier et du manoir des abbesses, protégés au titre des monuments historiques.",
      },
    ],
  },
  {
    slug: "le-mesnil-esnard",
    nom: "Le Mesnil-Esnard",
    a: "au Mesnil-Esnard",
    autour: "autour du Mesnil-Esnard",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76429"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison au Mesnil-Esnard : PLU métropolitain, 65 indices de cavités, guichet numérique communal. Dossier PCMI complet à prix fixe.",
    accroche:
      "Sur le plateau est, au-dessus de Bonsecours, Le Mesnil-Esnard compte 65 indices de cavités, dont 26 anciennes carrières, et dispose de son propre guichet numérique pour les permis.",
    urbanisme: pluMetropolitain("Le Mesnil-Esnard"),
    depot: {
      texte:
        "Depuis le 1er janvier 2022, la commune a son propre guichet numérique des autorisations d'urbanisme, distinct de celui de la Métropole. Le dépôt sur papier en mairie reste possible, en cinq exemplaires, mais pas par courriel.",
      source: { label: "Ville du Mesnil-Esnard, autorisations d'urbanisme", url: "https://www.le-mesnil-esnard.fr/autorisations-durbanisme/" },
    },
    risques: [
      cavitesRecensees("Le Mesnil-Esnard", REPERES["76429"]),
      ppriCailly("Le Mesnil-Esnard"),
      catastrophesNaturelles("Le Mesnil-Esnard", REPERES["76429"]),
    ],
    patrimoine: [],
    architecture: {
      texte:
        "Depuis une délibération du 28 novembre 2020, le permis de démolir est exigé sur toute la commune, même pour une démolition partielle : à prévoir si votre terrain porte une construction à abattre.",
      source: { label: "Ville du Mesnil-Esnard, autorisations d'urbanisme", url: "https://www.le-mesnil-esnard.fr/autorisations-durbanisme/" },
    },
    communesVoisines: ["Bonsecours", "Amfreville-la-Mi-Voie", "Franqueville-Saint-Pierre", "Belbeuf", "Saint-Léger-du-Bourg-Denis"],
    faq: [
      faqMarniere("au Mesnil-Esnard", REPERES["76429"]),
      {
        q: "Faut-il un permis de démolir pour une vieille construction sur le terrain ?",
        a: "Oui : au Mesnil-Esnard, toute démolition, même partielle, demande un permis de démolir. Il peut être déposé avec le permis de construire, dans le même dossier ; nous l'intégrons si votre terrain est concerné.",
      },
    ],
  },
  {
    slug: "saint-jacques-sur-darnetal",
    nom: "Saint-Jacques-sur-Darnétal",
    a: "à Saint-Jacques-sur-Darnétal",
    autour: "autour de Saint-Jacques-sur-Darnétal",
    departement: "76",
    intercommunalite: METROPOLE_ROUEN,
    pole: "rouen",
    reperes: REPERES["76591"],
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Saint-Jacques-sur-Darnétal : 239 indices de cavités, PLU métropolitain, PPRi. Dossier PCMI complet à prix fixe.",
    accroche:
      "Sur le plateau à l'est de Darnétal, traversé par la N31, Saint-Jacques-sur-Darnétal recense 239 indices de cavités souterraines : un terrain s'y achète après avoir vérifié son sous-sol.",
    urbanisme: pluMetropolitain("Saint-Jacques-sur-Darnétal"),
    depot: {
      texte:
        "Dépôt gratuit en ligne sur le guichet numérique de la Métropole Rouen Normandie, vers lequel renvoie le site de la mairie ; la commune est automatiquement informée du dépôt. Le dépôt sur papier reste possible.",
      source: { label: "Mairie de Saint-Jacques-sur-Darnétal, guichet numérique", url: "https://www.mairie-st-jacques.fr/urbanisme/gnau" },
    },
    risques: [
      cavitesRecensees("Saint-Jacques-sur-Darnétal", REPERES["76591"]),
      ppriCailly("Saint-Jacques-sur-Darnétal"),
      catastrophesNaturelles("Saint-Jacques-sur-Darnétal", REPERES["76591"]),
    ],
    patrimoine: [],
    architecture: {
      texte:
        "La commune publie les plans de zonage du PLU métropolitain par secteur (Nord, Bourg-Ouest, Est) et les dispositions des secteurs qui dérogent au recul imposé le long des grands axes routiers.",
      source: { label: "Mairie de Saint-Jacques-sur-Darnétal, PLU", url: "https://www.mairie-st-jacques.fr/urbanisme/plan-local-durbanisme-intercommunal" },
    },
    communesVoisines: ["Darnétal", "Saint-Aubin-Épinay", "Roncherolles-sur-le-Vivier", "Bois-l'Évêque", "Préaux"],
    faq: [
      faqMarniere("à Saint-Jacques-sur-Darnétal", REPERES["76591"]),
      {
        q: "Mon terrain est-il le long de la N31 ?",
        a: "Le long des grands axes routiers, un recul des constructions peut s'imposer, sauf dans les secteurs qui y dérogent. La commune publie ces dispositions avec ses plans de zonage : nous les appliquons à votre parcelle.",
      },
    ],
  },
];
