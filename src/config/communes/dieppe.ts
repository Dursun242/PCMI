import type { Fait, Source, Ville } from "../normandie";
import { REVUE, cavitesRecensees } from "./commun";

/** Agglomération de Dieppe. */
// Pas de PLUi à Dieppe-Maritime : chaque commune garde son PLU communal.

const DIEPPE_MARITIME = "la communauté d'agglomération de la Région dieppoise (Dieppe-Maritime), où chaque commune garde son propre PLU";

const PPRLI_SCIE: Source = {
  label: "Géorisques, PPRLI du bassin versant de la Scie (arrêté du 29 mai 2020)",
  url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/76DDTM20120001/document/1c8efe50-8a5a-46fd-8543-f970814fdab2",
};
const PPRLI_ARQUES: Source = {
  label: "Géorisques, PPRLI de la vallée de l'Arques, arrêté du 28 juin 2022",
  url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/76DDTM20120002/document/e9e20d88-10d1-4818-9895-04c7537bcc28",
};
const GNAU_TERROIR_DE_CAUX = "guichet numérique des autorisations d'urbanisme (gnau30.operis.fr/terroirdecaux)";

function pprliScie(nom: string): Fait {
  return {
    texte: `${nom} est soumise au plan de prévention des risques littoraux et d'inondation du bassin versant de la Scie, approuvé le 29 mai 2020 : débordement, ruissellement et coulées de boue, remontées de nappe et submersion marine.`,
    source: PPRLI_SCIE,
  };
}

function pprliArques(nom: string): Fait {
  return {
    texte: `${nom} est soumise au plan de prévention des risques littoraux et d'inondation de la vallée de l'Arques, approuvé le 28 juin 2022 avec Dieppe et les communes voisines : débordement, ruissellement, remontées de nappe et submersion marine.`,
    source: PPRLI_ARQUES,
  };
}

const faqPluCommunal = (nom: string, a: string) => ({
  q: `Quel règlement s'applique ${a} ?`,
  a: `Le PLU de ${nom}. Il n'y a pas de PLU intercommunal à Dieppe-Maritime : chaque commune a ses propres règles d'implantation, de hauteur et d'aspect. Nous lisons le règlement de la zone de votre terrain avant de chiffrer.`,
});

export const communesDieppe: Ville[] = [
  {
    slug: "offranville",
    nom: "Offranville",
    a: "à Offranville",
    autour: "autour d'Offranville",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Offranville : PLU en révision sur les cavités, PPRLI de la Scie, site classé de l'église. Dossier complet à prix fixe.",
    accroche:
      "Dans le bassin versant de la Scie, Offranville révise son PLU pour mettre à jour le recensement de ses cavités souterraines : un terrain s'y regarde d'abord sur ces nouvelles cartes.",
    urbanisme: {
      texte:
        "Offranville est couverte par un PLU communal approuvé le 28 février 2014 et modifié en 2017. Une révision allégée, soumise à enquête publique au printemps 2026, porte notamment sur la mise à jour des indices de cavités souterraines.",
      source: { label: "Ville d'Offranville, règlement du PLU", url: "https://www.offranville.fr/images/Rglement%20PLU%20Offranville.pdf" },
    },
    depot: {
      texte: `Les demandes dématérialisées passent par le ${GNAU_TERROIR_DE_CAUX}, vers lequel renvoie la commune ; les formulaires de permis sont aussi téléchargeables pour un dépôt en mairie.`,
      source: { label: "Ville d'Offranville, urbanisme", url: "https://www.offranville.fr/etre-citoyen/urbanisme" },
    },
    risques: [
      cavitesRecensees("Offranville", "76482", 21),
      {
        texte:
          "Dans les secteurs de présomption de cavités délimités par le PLU, seules sont admises notamment l'extension mesurée des constructions existantes, sans nouveau logement, et la reconstruction après un sinistre qui n'est pas dû à un effondrement.",
        source: { label: "Ville d'Offranville, règlement du PLU", url: "https://www.offranville.fr/images/Rglement%20PLU%20Offranville.pdf" },
      },
      pprliScie("Offranville"),
    ],
    patrimoine: [
      {
        texte: "L'église, le calvaire et l'if d'Offranville forment un site classé depuis un arrêté du 22 mai 1933.",
        source: {
          label: "Géoportail de l'urbanisme, arrêté de classement du 22 mai 1933",
          url: "https://data.geopf.fr/annexes/gpu/documents/130006265_SUP_R28_AC2/6e80f68e35913a5dc65880a202e6a67b/AC2_76018_19330522_act.pdf",
        },
      },
    ],
    architecture: {
      texte:
        "La commune publie sur son site le recensement des indices de cavités et les propositions de périmètres de sécurité (secteurs Est et Ouest, décembre 2025) : à consulter avant d'acheter un terrain.",
      source: { label: "Ville d'Offranville, urbanisme", url: "https://www.offranville.fr/etre-citoyen/urbanisme" },
    },
    communesVoisines: ["Hautot-sur-Mer", "Saint-Aubin-sur-Scie", "Ouville-la-Rivière", "Sauqueville", "Ambrumesnil"],
    faq: [
      faqPluCommunal("Offranville", "à Offranville"),
      {
        q: "La révision du PLU change-t-elle les zones de cavités ?",
        a: "C'est son objet : elle met à jour le recensement des indices et les périmètres de sécurité. Selon la date de votre dépôt, c'est l'ancien ou le nouveau règlement qui s'applique ; nous vérifions la version en vigueur et les cartes publiées par la commune.",
      },
    ],
  },
  {
    slug: "hautot-sur-mer",
    nom: "Hautot-sur-Mer",
    a: "à Hautot-sur-Mer",
    autour: "autour d'Hautot-sur-Mer",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Hautot-sur-Mer : PLU de 2024, loi Littoral, recul de la falaise, submersion à Pourville. Dossier complet à prix fixe.",
    accroche:
      "Hautot, Petit-Appeville et Pourville, où la Scie rejoint la Manche : commune littorale, Hautot-sur-Mer cumule loi Littoral, recul des falaises et submersion marine.",
    urbanisme: {
      texte: "Hautot-sur-Mer est couverte par un PLU communal récent, approuvé par le conseil municipal le 29 février 2024.",
      source: {
        label: "Géoportail de l'urbanisme, délibération d'approbation du PLU de Hautot-sur-Mer",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_76349/62a0989fe6e870e4fced50f81c7cde59/76349_procedure_20240229.pdf",
      },
    },
    depot: {
      texte: `Le site de la mairie renvoie, pour les autorisations d'urbanisme, vers le ${GNAU_TERROIR_DE_CAUX} ; le dépôt sur papier en mairie reste possible.`,
      source: { label: "Mairie d'Hautot-sur-Mer", url: "https://www.hautot-sur-mer.fr/" },
    },
    risques: [
      {
        texte:
          "Dans les espaces exposés au recul du trait de côte (aléas à 20, 50 et 100 ans) reportés au PLU, seules sont admises notamment les extensions de moins de 20 m² de logements existants qui s'éloignent de la falaise ; la reconstruction après sinistre y est interdite.",
        source: {
          label: "Géoportail de l'urbanisme, règlement du PLU de Hautot-sur-Mer (art. D7.3)",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76349/62a0989fe6e870e4fced50f81c7cde59/76349_reglement_20240229.pdf",
        },
      },
      {
        texte:
          "À Pourville, le plan de prévention de la Scie classe les secteurs exposés aux chocs des vagues et la bande derrière la digue en zone rouge d'extrême danger.",
        source: {
          label: "Géorisques, règlement du PPRLI du bassin versant de la Scie",
          url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/76DDTM20120001/document/a8dd42b3-da01-49f1-8718-d7bb6cfda6d9",
        },
      },
      cavitesRecensees("Hautot-sur-Mer", "76349", 78),
    ],
    patrimoine: [
      {
        texte:
          "Le clocher de l'ancienne église du Petit-Appeville est inscrit monument historique depuis 1947 : à ses abords, l'Architecte des Bâtiments de France donne son avis et l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, ancienne église du Petit-Appeville (PA00100692)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00100692" },
      },
      {
        texte: "Le panorama sur la plage de Pourville est un site inscrit depuis 1934, pour préserver la vue sur la plage, la mer et les falaises.",
        source: {
          label: "Géoportail de l'urbanisme, arrêté d'inscription du site de Pourville",
          url: "https://data.geopf.fr/annexes/gpu/documents/130006265_SUP_R28_AC2/6e80f68e35913a5dc65880a202e6a67b/AC2_76026_19341029_act.pdf",
        },
      },
    ],
    architecture: {
      texte:
        "Commune littorale, Hautot-sur-Mer délimite dans son PLU les espaces proches du rivage, la bande littorale des 100 mètres, les espaces remarquables et les coupures d'urbanisation.",
      source: {
        label: "Géoportail de l'urbanisme, règlement du PLU de Hautot-sur-Mer",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_76349/62a0989fe6e870e4fced50f81c7cde59/76349_reglement_20240229.pdf",
      },
    },
    communesVoisines: ["Offranville", "Varengeville-sur-Mer", "Dieppe", "Saint-Aubin-sur-Scie"],
    faq: [
      {
        q: "Peut-on construire près de la falaise ?",
        a: "Non pour une maison neuve dans les espaces exposés au recul du trait de côte reportés au PLU : seules de petites extensions qui s'éloignent du bord y sont admises. Nous situons votre parcelle par rapport à ces aléas avant toute étude.",
      },
      faqPluCommunal("Hautot-sur-Mer", "à Hautot-sur-Mer"),
    ],
  },
  {
    slug: "arques-la-bataille",
    nom: "Arques-la-Bataille",
    a: "à Arques-la-Bataille",
    autour: "autour d'Arques-la-Bataille",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Arques-la-Bataille : 160 indices de cavités, ZPPAUP, château classé, PPRLI de l'Arques. Dossier complet à prix fixe.",
    accroche:
      "Au pied des ruines de son château et en lisière de la forêt d'Arques, Arques-la-Bataille cumule 160 indices de cavités, cinq monuments historiques et une zone de protection du patrimoine.",
    urbanisme: {
      texte:
        "Arques-la-Bataille est couverte par un PLU communal approuvé le 18 décembre 2017, mis en compatibilité par arrêté préfectoral du 19 mars 2025.",
      source: { label: "Ville d'Arques-la-Bataille, documents d'urbanisme", url: "https://www.ville-arques-la-bataille.fr/urbanisme/documents-d-urbanisme-de-la-commune/" },
    },
    depot: {
      texte:
        "La commune met en ligne les formulaires, dont celui du permis de construire de maison individuelle, et invite à se renseigner en mairie avant tout projet ; son site ne mentionne pas de guichet en ligne.",
      source: {
        label: "Ville d'Arques-la-Bataille, demandes d'urbanisme",
        url: "https://www.ville-arques-la-bataille.fr/urbanisme/demandes-d-urbanisme-permis-de-construire-et-d%C3%A9clarations-pr%C3%A9alables/",
      },
    },
    risques: [
      cavitesRecensees("Arques-la-Bataille", "76026", 160),
      {
        texte:
          "Dans les aires affectées par un risque d'effondrement de cavité ou d'éboulement de falaise, le PLU n'autorise notamment que l'agrandissement mesuré des constructions existantes, sans nouveau logement.",
        source: {
          label: "Géoportail de l'urbanisme, règlement du PLU d'Arques-la-Bataille",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76026/ed6f9591de76161ed7ea75d2d4680b31/76026_reglement_20250319.pdf",
        },
      },
      pprliArques("Arques-la-Bataille"),
    ],
    patrimoine: [
      {
        texte:
          "Les ruines du château d'Arques et l'église Notre-Dame-de-l'Assomption sont classées monuments historiques ; l'ancien bailliage, le manoir d'Archelles et le groupe scolaire de Georges Thurin sont inscrits. À leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, ruines du château d'Arques (PA00100544)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00100544" },
      },
    ],
    architecture: {
      texte:
        "Une large partie de la commune est couverte par une ZPPAUP, dont le règlement encadre extensions, ravalements, ouvertures, clôtures et matériaux (le PVC y est limité) ; l'Architecte des Bâtiments de France peut imposer des prescriptions.",
      source: { label: "Ville d'Arques-la-Bataille, urbanisme", url: "https://www.ville-arques-la-bataille.fr/urbanisme/" },
    },
    communesVoisines: ["Martin-Église", "Rouxmesnil-Bouteilles", "Saint-Aubin-le-Cauf", "Ancourt", "Martigny"],
    faq: [
      {
        q: "Mon terrain est-il dans la zone de protection du patrimoine ?",
        a: "Une large partie de la commune l'est. Dans ce périmètre, l'Architecte des Bâtiments de France examine le projet et peut imposer des matériaux, des teintes ou des ouvertures : nous dessinons la maison en tenant compte du règlement dès l'esquisse.",
      },
      faqPluCommunal("Arques-la-Bataille", "à Arques-la-Bataille"),
    ],
  },
  {
    slug: "saint-aubin-sur-scie",
    nom: "Saint-Aubin-sur-Scie",
    a: "à Saint-Aubin-sur-Scie",
    autour: "autour de Saint-Aubin-sur-Scie",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Saint-Aubin-sur-Scie : PLU de 2021, 85 indices de cavités, PPRLI de la Scie, dépôt sur GéoPermis. Dossier à prix fixe.",
    accroche:
      "Dans la vallée de la Scie, Saint-Aubin-sur-Scie partage avec Tourville-sur-Arques le domaine du château de Miromesnil et recense 85 indices de cavités souterraines.",
    urbanisme: {
      texte: "Saint-Aubin-sur-Scie est couverte par un PLU communal approuvé par le conseil municipal le 9 décembre 2021.",
      source: {
        label: "Géoportail de l'urbanisme, délibération d'approbation du PLU de Saint-Aubin-sur-Scie",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_76565/5728bf380a6f1c8dd79116c2e1b6b1fd/76565_procedure_20211209.pdf",
      },
    },
    depot: {
      texte:
        "Depuis le 1er janvier 2022, les demandes déposées par voie électronique doivent passer par la plateforme GéoPermis indiquée par la commune ; un envoi par courriel n'est pas recevable.",
      source: { label: "Commune de Saint-Aubin-sur-Scie, demande d'autorisation d'urbanisme", url: "https://www.saint-aubin-sur-scie.fr/demande-dautorisation-durbanisme/" },
    },
    risques: [
      cavitesRecensees("Saint-Aubin-sur-Scie", "76565", 85),
      {
        texte:
          "Dans les secteurs de risque de cavités reportés au PLU, toute nouvelle construction principale est interdite, sauf si une étude géotechnique montre l'absence de danger.",
        source: {
          label: "Géoportail de l'urbanisme, règlement du PLU de Saint-Aubin-sur-Scie",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76565/5728bf380a6f1c8dd79116c2e1b6b1fd/76565_reglement_20211209.pdf",
        },
      },
      pprliScie("Saint-Aubin-sur-Scie"),
    ],
    patrimoine: [
      {
        texte:
          "La chapelle du château de Miromesnil est classée monument historique depuis 1957 : à ses abords, l'Architecte des Bâtiments de France donne son avis et l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, château de Miromesnil (PA00101024)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00101024" },
      },
      {
        texte: "Les futaies du parc de Miromesnil (1942) et le « chemin à carrosse » vers Tourville-sur-Arques (1975) sont des sites classés.",
        source: {
          label: "Géoportail de l'urbanisme, arrêté de classement des futaies de Miromesnil",
          url: "https://data.geopf.fr/annexes/gpu/documents/130006265_SUP_R28_AC2/6e80f68e35913a5dc65880a202e6a67b/AC2_76042_19421019_act.pdf",
        },
      },
    ],
    communesVoisines: ["Tourville-sur-Arques", "Rouxmesnil-Bouteilles", "Offranville", "Hautot-sur-Mer", "Dieppe"],
    faq: [
      {
        q: "Un indice de cavité empêche-t-il de construire ?",
        a: "Dans le secteur de risque reporté au PLU, une maison neuve est interdite sauf si une étude géotechnique montre l'absence de danger. Nous vérifions le plan de zonage avant de chiffrer et vous orientons vers un bureau spécialisé si une étude est nécessaire.",
      },
      faqPluCommunal("Saint-Aubin-sur-Scie", "à Saint-Aubin-sur-Scie"),
    ],
  },
  {
    slug: "martin-eglise",
    nom: "Martin-Église",
    a: "à Martin-Église",
    autour: "autour de Martin-Église",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Martin-Église : PLU communal, site inscrit de la vallée de l'Eaulne, PPRLI de l'Arques. Dossier PCMI complet à prix fixe.",
    accroche:
      "Aux portes de Dieppe, une partie de Martin-Église est incluse dans le site inscrit de la vallée de l'Eaulne : l'Architecte des Bâtiments de France y est consulté sur les projets.",
    urbanisme: {
      texte:
        "Martin-Église est couverte par un PLU communal approuvé en 2008 et révisé en 2018 ; une révision allégée, arrêtée en 2021, en a depuis modifié les pièces.",
      source: { label: "Commune de Martin-Église, rapport de présentation du PLU", url: "https://www.martineglise.fr/wp-content/uploads/2024/04/Rapport_Pre%CC%81sentation-RA.pdf" },
    },
    depot: {
      texte:
        "Le site de la commune ne propose pas de guichet en ligne : il renvoie vers service-public.fr pour les autorisations d'urbanisme et oriente vers le CAUE 76 et l'Architecte des Bâtiments de France pour préparer le projet.",
      source: { label: "Commune de Martin-Église, services compétents", url: "https://www.martineglise.fr/services-competents/" },
    },
    risques: [
      pprliArques("Martin-Église"),
      cavitesRecensees("Martin-Église", "76414", 20),
      {
        texte: "Le règlement du PLU délimite des zones de risque autour des indices de cavités, où seules des extensions mesurées sont admises sous conditions.",
        source: { label: "Commune de Martin-Église, PLU", url: "https://www.martineglise.fr/plan-local-durbanisme/" },
      },
    ],
    patrimoine: [
      {
        texte: "Une partie du territoire communal est incluse dans le site inscrit de la vallée de l'Eaulne, protégé par un arrêté de 1984.",
        source: {
          label: "Géoportail de l'urbanisme, arrêté d'inscription de la vallée de l'Eaulne",
          url: "https://data.geopf.fr/annexes/gpu/documents/130006265_SUP_R28_AC2/6e80f68e35913a5dc65880a202e6a67b/AC2_76141_19841012_act.pdf",
        },
      },
    ],
    architecture: {
      texte: "Selon la commune, dans le site de la vallée de l'Eaulne, l'Architecte des Bâtiments de France doit être consulté et peut imposer des prescriptions.",
      source: { label: "Commune de Martin-Église, services compétents", url: "https://www.martineglise.fr/services-competents/" },
    },
    communesVoisines: ["Rouxmesnil-Bouteilles", "Grèges", "Arques-la-Bataille", "Dieppe", "Ancourt"],
    faq: [
      {
        q: "Mon terrain est-il dans le site de la vallée de l'Eaulne ?",
        a: "Une partie seulement de la commune l'est. Nous vérifions le périmètre sur les servitudes du Géoportail de l'urbanisme : s'il couvre votre parcelle, l'Architecte des Bâtiments de France est consulté et nous soignons l'insertion paysagère du projet.",
      },
      faqPluCommunal("Martin-Église", "à Martin-Église"),
    ],
  },
  {
    slug: "rouxmesnil-bouteilles",
    nom: "Rouxmesnil-Bouteilles",
    a: "à Rouxmesnil-Bouteilles",
    autour: "autour de Rouxmesnil-Bouteilles",
    departement: "76",
    intercommunalite: DIEPPE_MARITIME,
    pole: "dieppe",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Rouxmesnil-Bouteilles : PLU de 2018, 43 indices de cavités, PPRLI de l'Arques, isolation près de la RD 927. Prix fixe.",
    accroche:
      "Limitrophe de Dieppe dans la vallée de l'Arques, Rouxmesnil-Bouteilles recense 43 indices de cavités et impose, le long de la RD 927, une isolation acoustique renforcée.",
    urbanisme: {
      texte:
        "Rouxmesnil-Bouteilles est couverte par un PLU communal approuvé le 8 octobre 2018, qui intègre un règlement local de publicité, mis en compatibilité en 2023.",
      source: {
        label: "Géoportail de l'urbanisme, délibération d'approbation du PLU de Rouxmesnil-Bouteilles",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_76545/fd3f5d6764b6ed5ee914fc049ef3bd58/76545_procedure_20181008.pdf",
      },
    },
    depot: {
      texte:
        "Le site de la commune ne mentionne pas de guichet en ligne : le dossier se dépose à la mairie, rue du Champ de Courses, où le PLU est consultable.",
      source: { label: "Commune de Rouxmesnil-Bouteilles, plan local d'urbanisme", url: "https://www.rouxmesnil-bouteilles.fr/plan-local-durbanisme/" },
    },
    risques: [
      cavitesRecensees("Rouxmesnil-Bouteilles", "76545", 43),
      {
        texte:
          "Le PLU impose un inventaire complémentaire pour urbaniser dans un rayon de 60 mètres autour d'une suspicion de cavité, et interdit toute nouvelle construction dans ce périmètre si la cavité est avérée.",
        source: {
          label: "Géoportail de l'urbanisme, règlement du PLU de Rouxmesnil-Bouteilles",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76545/fd3f5d6764b6ed5ee914fc049ef3bd58/76545_reglement_20181008.pdf",
        },
      },
      pprliArques("Rouxmesnil-Bouteilles"),
      {
        texte: "Selon le PLU, les habitations situées à moins de 250 mètres de la RD 927 (avenue de Breauté) doivent respecter les normes d'isolation acoustique.",
        source: {
          label: "Géoportail de l'urbanisme, règlement du PLU de Rouxmesnil-Bouteilles",
          url: "https://data.geopf.fr/annexes/gpu/documents/DU_76545/fd3f5d6764b6ed5ee914fc049ef3bd58/76545_reglement_20181008.pdf",
        },
      },
    ],
    patrimoine: [],
    communesVoisines: ["Martin-Église", "Arques-la-Bataille", "Dieppe", "Saint-Aubin-sur-Scie"],
    faq: [
      faqPluCommunal("Rouxmesnil-Bouteilles", "à Rouxmesnil-Bouteilles"),
      {
        q: "Mon terrain est-il proche de la RD 927 ?",
        a: "À moins de 250 mètres de l'avenue de Breauté, le PLU impose les normes d'isolation acoustique. Nous le signalons dans le dossier et votre constructeur en tient compte dans le choix des menuiseries et des parois.",
      },
    ],
  },
];
