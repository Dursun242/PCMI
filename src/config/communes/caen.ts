import type { Fait, Source, Ville } from "../normandie";
import { REVUE, cavitesRecensees, georisques } from "./commun";

/**
 * Agglomération de Caen (communauté urbaine Caen la mer). Le PLUi-HM est
 * attendu début 2027 : d'ici là, chaque commune applique son propre PLU.
 */

const CAEN_LA_MER = "la communauté urbaine Caen la mer, où chaque commune applique encore son propre PLU";

const PPRN_ORNE: Source = {
  label: "Géorisques, PPRN multirisques de la basse vallée de l'Orne (arrêté du 10 août 2021)",
  url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/14DDTM20110006/document/f3c85913-c8a1-4c5a-bca0-282ad1113dad",
};

function pprnOrne(nom: string, risques: string): Fait {
  return {
    texte: `${nom} est couverte par le plan de prévention multirisques de la basse vallée de l'Orne, approuvé le 10 août 2021, au titre ${risques}.`,
    source: PPRN_ORNE,
  };
}

function argiles(nom: string, insee: string, niveau: "faible" | "modéré" | "important"): Fait {
  return {
    texte: `Géorisques classe ${nom} en exposition « ${niveau} » au retrait-gonflement des argiles : selon la parcelle, une étude de sol peut être exigée pour adapter les fondations.`,
    source: georisques(nom, insee),
  };
}

const faqPluiHm = (nom: string, a: string) => ({
  q: `Quel règlement s'applique ${a} ?`,
  a: `Le PLU de ${nom}, tant que le PLUi-HM de Caen la mer n'est pas approuvé : son enquête publique s'est close en octobre 2026 et l'approbation est envisagée début 2027. Selon la date de votre dépôt, nous appliquons l'un ou l'autre règlement.`,
});

const GUICHET_CAEN_LA_MER = "le guichet unique en ligne de Caen la mer";

export const communesCaen: Ville[] = [
  {
    slug: "fleury-sur-orne",
    nom: "Fleury-sur-Orne",
    a: "à Fleury-sur-Orne",
    autour: "autour de Fleury-sur-Orne",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Fleury-sur-Orne : PLU révisé en 2020, anciennes carrières, PPRN de l'Orne, argiles. Dossier PCMI complet à prix fixe.",
    accroche:
      "Sous le plateau des Hauts de l'Orne s'étendent d'anciennes carrières de pierre de Caen, où plus de 12 000 personnes se sont abritées en juin 1944 : à Fleury-sur-Orne, le sous-sol fait partie de l'histoire.",
    urbanisme: {
      texte:
        "Le PLU de Fleury-sur-Orne est issu d'une révision approuvée le 30 janvier 2020 par le conseil communautaire de Caen la mer ; sa modification n° 2 a été approuvée le 15 décembre 2022.",
      source: {
        label: "Géoportail de l'urbanisme, PLU de Fleury-sur-Orne",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14271/76084f63399e5137782d60e14eb92ccc/14271_procedure_20221215.pdf",
      },
    },
    depot: {
      texte: `Depuis le 1er janvier 2022, les demandes peuvent être déposées en ligne sur ${GUICHET_CAEN_LA_MER} ; le service urbanisme de la mairie, rue Serge Rouzière, reçoit sur rendez-vous.`,
      source: { label: "Ville de Fleury-sur-Orne, urbanisme", url: "https://fleurysurorne.fr/vivre-a-fleury/cadre-de-vie/urbanisme/" },
    },
    risques: [
      cavitesRecensees("Fleury-sur-Orne", "14271", 18, ", toutes d'anciennes carrières souterraines"),
      pprnOrne("Fleury-sur-Orne", "des inondations par débordement de l'Orne et de la submersion marine qui remonte le fleuve"),
      argiles("Fleury-sur-Orne", "14271", "important"),
    ],
    patrimoine: [
      {
        texte:
          "Le clocher du XIe siècle de l'église d'Allemagne-la-Basse est classé monument historique depuis 1913, et une maison du XVIIIe siècle rue de Saint-André est inscrite depuis 2009 : à leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, église d'Allemagne-la-Basse (PA00111338)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111338" },
      },
    ],
    communesVoisines: ["Caen", "Ifs", "Louvigny", "Saint-André-sur-Orne"],
    faq: [
      faqPluiHm("Fleury-sur-Orne", "à Fleury-sur-Orne"),
      {
        q: "Peut-on construire au-dessus des anciennes carrières ?",
        a: "Le périmètre des grandes carrières des Hauts de l'Orne est un parc non constructible. Ailleurs, 18 anciennes carrières sont recensées sur la commune : nous situons votre terrain par rapport à elles avant de chiffrer, et une étude de sol peut être nécessaire.",
      },
    ],
  },
  {
    slug: "ifs",
    nom: "Ifs",
    a: "à Ifs",
    autour: "autour d'Ifs",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Ifs : PLU de 2015, remontées de nappe, argiles, église Saint-André classée. Dossier PCMI complet à prix fixe.",
    accroche:
      "Au sud de Caen, le long du périphérique, Ifs a installé son hôtel de ville dans la ferme Saint-Bernard, inscrite monument historique ; ses dernières dents creuses ont été ouvertes à la construction en 2021.",
    urbanisme: {
      texte:
        "Ifs est couverte par un PLU approuvé le 27 avril 2015 ; sa modification simplifiée n° 2, approuvée par Caen la mer le 18 mars 2021, a créé deux secteurs constructibles sur les dernières dents creuses entre les quartiers de l'Europe et du Canada.",
      source: {
        label: "Géoportail de l'urbanisme, modification simplifiée n° 2 du PLU d'Ifs",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14341/64f22a61d2715fd944e885743cf9489c/14341_procedure_20210318.pdf",
      },
    },
    depot: {
      texte: `La mairie renvoie vers ${GUICHET_CAEN_LA_MER} pour le dépôt dématérialisé des permis ; le service urbanisme, esplanade François-Mitterrand, reçoit sur rendez-vous pris par téléphone.`,
      source: { label: "Ville d'Ifs, dépôt de dossier en ligne", url: "https://www.ville-ifs.fr/mes-demarches/urbanisme/depot-de-dossier-en-ligne-guichet-unique-urbanisme/" },
    },
    risques: [
      {
        texte: "Géorisques signale un risque de remontée de nappe sur le territoire communal : à vérifier à l'adresse du terrain, en particulier si vous prévoyez un sous-sol.",
        source: georisques("Ifs", "14341"),
      },
      argiles("Ifs", "14341", "modéré"),
      cavitesRecensees("Ifs", "14341", 3, " : une ancienne carrière et deux souterrains"),
    ],
    patrimoine: [
      {
        texte:
          "Le clocher et la façade sud de l'église Saint-André sont classés monument historique depuis 1946 ; la ferme Saint-Bernard et son colombier, devenus l'hôtel de ville, sont inscrits depuis 1979. À leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, église Saint-André d'Ifs (PA00111455)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111455" },
      },
    ],
    communesVoisines: ["Caen", "Fleury-sur-Orne", "Cormelles-le-Royal", "Castine-en-Plaine", "Soliers"],
    faq: [
      faqPluiHm("Ifs", "à Ifs"),
      {
        q: "Un sous-sol est-il possible à Ifs ?",
        a: "C'est à étudier parcelle par parcelle : Géorisques signale un risque de remontée de nappe sur la commune. Nous le vérifions à l'adresse du terrain avant de dessiner, et adaptons le projet si besoin (vide sanitaire plutôt que sous-sol).",
      },
    ],
  },
  {
    slug: "bretteville-sur-odon",
    nom: "Bretteville-sur-Odon",
    a: "à Bretteville-sur-Odon",
    autour: "autour de Bretteville-sur-Odon",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Bretteville-sur-Odon : PLU modifié en 2026, PPRN de l'Orne, argiles, ferme de la Baronnerie classée. Dossier à prix fixe.",
    accroche:
      "À l'ouest de Caen, Bretteville-sur-Odon garde l'ancien manoir de l'abbaye du Mont-Saint-Michel, dit ferme de la Baronnerie, classé monument historique, et un PLU modifié encore en septembre 2026.",
    urbanisme: {
      texte:
        "Bretteville-sur-Odon a un PLU approuvé en 2004 et plusieurs fois modifié : la modification n° 5 a été approuvée le 18 décembre 2025, et la modification simplifiée n° 4 par Caen la mer le 24 septembre 2026.",
      source: {
        label: "Géoportail de l'urbanisme, modification simplifiée n° 4 du PLU de Bretteville-sur-Odon",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14101/7f3546af5d2b1074502058c867989f72/14101_procedure_20260924.pdf",
      },
    },
    depot: {
      texte: `Dépôt en ligne sur ${GUICHET_CAEN_LA_MER}, ou sur papier en mairie, directement ou par lettre recommandée avec avis de réception.`,
      source: { label: "Ville de Bretteville-sur-Odon, dépôt en ligne", url: "https://www.brettevillesurodon.fr/depot-en-ligne-des-demandes-durbanisme/" },
    },
    risques: [
      pprnOrne("Bretteville-sur-Odon", "du risque d'inondation par débordement de cours d'eau"),
      argiles("Bretteville-sur-Odon", "14101", "important"),
      cavitesRecensees("Bretteville-sur-Odon", "14101", 8, ", toutes d'anciennes carrières"),
    ],
    patrimoine: [
      {
        texte:
          "L'ancien manoir de l'abbaye du Mont-Saint-Michel, dit ferme de la Baronnerie, est partiellement classé monument historique depuis 1993 ; le clocher de l'église et la ferme du Vieux Clocher sont inscrits. À leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, ferme de la Baronnerie (PA00111825)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111825" },
      },
    ],
    communesVoisines: ["Caen", "Carpiquet", "Louvigny", "Verson", "Éterville"],
    faq: [
      faqPluiHm("Bretteville-sur-Odon", "à Bretteville-sur-Odon"),
      {
        q: "Mon terrain est-il en zone inondable ?",
        a: "Le plan de prévention de la basse vallée de l'Orne ne couvre que certains secteurs de la commune, au titre du débordement de cours d'eau. Nous situons votre parcelle sur sa carte réglementaire avant de chiffrer.",
      },
    ],
  },
  {
    slug: "verson",
    nom: "Verson",
    a: "à Verson",
    autour: "autour de Verson",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Verson : PLU des Rives de l'Odon, écoquartier, PPRN de l'Orne, argiles, église classée. Dossier PCMI complet à prix fixe.",
    accroche:
      "Dans la vallée de l'Odon, Verson aménage son écoquartier, environ 600 logements entre maisons individuelles et petits collectifs, autour d'une église classée monument historique depuis 1910.",
    urbanisme: {
      texte:
        "Verson reste couverte par le PLU intercommunal des Rives de l'Odon, approuvé en 2008 et géré aujourd'hui par Caen la mer ; il a été révisé en 2020 et modifié en 2021.",
      source: {
        label: "Géoportail de l'urbanisme, PLU de Verson",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14738/e011745fca2e0f289f11c6e80b0cadee/14738_procedure_20210318.pdf",
      },
    },
    depot: {
      texte: `Les permis peuvent être déposés en ligne sur ${GUICHET_CAEN_LA_MER} ; le service urbanisme de la mairie reçoit sur rendez-vous le lundi et le mercredi.`,
      source: { label: "Ville de Verson, entreprendre des travaux", url: "https://www.ville-verson.fr/urbanisme/entreprendre-travaux/" },
    },
    risques: [
      pprnOrne("Verson", "du risque d'inondation par débordement de cours d'eau"),
      argiles("Verson", "14738", "important"),
      cavitesRecensees("Verson", "14738", 1, ", une cavité naturelle signalée par une doline"),
    ],
    patrimoine: [
      {
        texte:
          "L'église des XIIe au XVe siècles est classée monument historique depuis 1910 ; la croix du cimetière et le manoir de la Fontaine sont inscrits depuis 1932 et 1933. À leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, église de Verson (PA00111793)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111793" },
      },
    ],
    architecture: {
      texte:
        "L'écoquartier (secteurs Saint-Martin et Perruques) doit compter environ 600 à 650 logements sur 20 hectares ; les phases 2 et 3 sont prévues entre 2026 et 2031.",
      source: { label: "Ville de Verson, écoquartier", url: "https://www.ville-verson.fr/urbanisme/ecoquartier/" },
    },
    communesVoisines: ["Bretteville-sur-Odon", "Carpiquet", "Mouen", "Saint-Manvieu-Norrey", "Fontaine-Étoupefour"],
    faq: [
      faqPluiHm("Verson", "à Verson"),
      {
        q: "Vous faites aussi les permis en écoquartier ?",
        a: "Oui. Un lot d'écoquartier ajoute au PLU le règlement et le cahier des prescriptions du lotissement : implantation, matériaux, clôtures. Nous les intégrons au dossier pour qu'il soit accepté du premier coup.",
      },
    ],
  },
  {
    slug: "thue-et-mue",
    nom: "Thue et Mue",
    a: "à Thue et Mue",
    autour: "autour de Thue et Mue",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Thue et Mue : un PLU par commune déléguée, RNU à Sainte-Croix-Grand-Tonne, argiles, carrières. Dossier à prix fixe.",
    accroche:
      "Commune nouvelle créée en 2017 et nommée d'après ses deux rivières, Thue et Mue réunit six villages, de Bretteville-l'Orgueilleuse à Cheux, qui n'ont pas tous le même règlement d'urbanisme.",
    urbanisme: {
      texte:
        "Thue et Mue n'a pas de PLU unique : chaque commune déléguée conserve le sien (Bretteville-l'Orgueilleuse, Brouay, Cheux, Le Mesnil-Patry, Putot-en-Bessin), tandis que Sainte-Croix-Grand-Tonne relève du règlement national d'urbanisme.",
      source: { label: "Commune de Thue et Mue, urbanisme", url: "https://thueetmue.fr/index.php/urbanisme" },
    },
    depot: {
      texte: `Les demandes, dont les permis de construire, peuvent être déposées en ligne sur ${GUICHET_CAEN_LA_MER} après création d'un compte ; le dépôt en mairie reste possible.`,
      source: { label: "Commune de Thue et Mue, urbanisme", url: "https://thueetmue.fr/index.php/urbanisme" },
    },
    risques: [
      {
        texte: "Géorisques recense pour la commune un risque de mouvement de terrain lié à d'anciennes carrières souterraines et un risque d'inondation par crue lente.",
        source: georisques("Thue et Mue", "14098"),
      },
      argiles("Thue et Mue", "14098", "important"),
    ],
    patrimoine: [
      {
        texte:
          "Les églises de Cheux (classée en 1910), de Bretteville-l'Orgueilleuse, de Putot-en-Bessin et de Sainte-Croix-Grand-Tonne, le château de la Motte et le manoir de Sainte-Croix sont protégés : à leurs abords, l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, église de Cheux (PA00111224)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111224" },
      },
    ],
    communesVoisines: ["Rots", "Saint-Manvieu-Norrey", "Moulins-en-Bessin", "Fontenay-le-Pesnel", "Verson"],
    faq: [
      {
        q: "Quel règlement s'applique à mon terrain ?",
        a: "Celui de la commune déléguée où il se trouve : le PLU de Bretteville-l'Orgueilleuse, de Brouay, de Cheux, du Mesnil-Patry ou de Putot-en-Bessin, ou le règlement national d'urbanisme à Sainte-Croix-Grand-Tonne. Le PLUi-HM de Caen la mer, attendu début 2027, les remplacera.",
      },
      {
        q: "Y a-t-il un risque lié aux anciennes carrières ?",
        a: "Géorisques signale ce risque sur la commune. Nous vérifions si votre parcelle est concernée avant de chiffrer ; une étude de sol peut être demandée pour adapter les fondations.",
      },
    ],
  },
  {
    slug: "rots",
    nom: "Rots",
    a: "à Rots",
    autour: "autour de Rots",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Rots : PLU de 2022, terrains à bâtir de l'Orée d'Ardennes, argiles, monuments de Lasson. Dossier PCMI complet à prix fixe.",
    accroche:
      "Commune nouvelle réunissant depuis 2016 Rots, Lasson et Secqueville-en-Bessin, de part et d'autre de la RN13, Rots ouvre à la construction le quartier de l'Orée d'Ardennes.",
    urbanisme: {
      texte:
        "Le PLU de la commune nouvelle de Rots, couvrant Rots, Lasson et Secqueville-en-Bessin, a été approuvé le 30 juin 2022 par Caen la mer, puis modifié le 22 mai 2025.",
      source: { label: "Commune de Rots, réglementation communale", url: "https://www.rots.fr/vie-pratique/urbanisme/reglementation-communale/" },
    },
    depot: {
      texte: `Depuis le 1er janvier 2022, les demandes d'autorisation de construire peuvent être déposées par voie électronique sur ${GUICHET_CAEN_LA_MER}, ou en mairie.`,
      source: { label: "Commune de Rots, autorisations de construire", url: "https://www.rots.fr/vie-pratique/urbanisme/autorisations-de-construction-reglementation/" },
    },
    risques: [
      argiles("Rots", "14543", "important"),
      cavitesRecensees("Rots", "14543", 2, ", deux anciennes carrières"),
    ],
    patrimoine: [
      {
        texte:
          "L'église de Rots (classée en 1909), le château de Lasson (classé en 1917), l'église de Secqueville-en-Bessin, la chapelle de l'Ortial et le manoir Saint-Ouen sont protégés : à leurs abords, l'Architecte des Bâtiments de France donne son avis.",
        source: { label: "Base Mérimée, église de Rots (PA00111641)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111641" },
      },
    ],
    architecture: {
      texte:
        "Le quartier de l'Orée d'Ardennes, à l'est du village, prévoit 270 logements sur 13,4 hectares, dont des terrains à bâtir d'environ 480 m² en moyenne.",
      source: { label: "Commune de Rots, ZAC de l'Orée d'Ardennes", url: "https://www.rots.fr/vie-pratique/urbanisme/zac-de-loree-dardennes/" },
    },
    communesVoisines: ["Thue et Mue", "Rosel", "Carpiquet", "Saint-Manvieu-Norrey", "Authie"],
    faq: [
      faqPluiHm("Rots", "à Rots"),
      {
        q: "Vous faites les permis sur les lots de l'Orée d'Ardennes ?",
        a: "Oui. Sur un terrain de ZAC, le dossier respecte à la fois le PLU et le cahier des prescriptions de l'aménageur. Sur 480 m² en moyenne, l'implantation se joue au mètre près : nous la calons dès l'esquisse.",
      },
    ],
  },
  {
    slug: "epron",
    nom: "Épron",
    a: "à Épron",
    autour: "autour d'Épron",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Épron : PLU modifié en 2025, remontées de nappe, argiles. Dossier PCMI complet à prix fixe par un maître d'œuvre normand.",
    accroche:
      "Limitrophe de Caen et d'Hérouville-Saint-Clair au nord, Épron n'a ni cavité recensée ni monument protégé : ici, c'est l'eau du sous-sol qu'il faut regarder.",
    urbanisme: {
      texte: "Épron a un PLU approuvé en 2006 ; sa modification n° 2 a été approuvée par le conseil communautaire de Caen la mer le 25 septembre 2025.",
      source: {
        label: "Géoportail de l'urbanisme, modification n° 2 du PLU d'Épron",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14242/cd880ec566241e80ae2671f3400f8ba7/14242_procedure_20250925.pdf",
      },
    },
    depot: {
      texte: "Caen la mer rappelle que les demandes de permis de construire s'adressent à la mairie de la commune où se situent les travaux, ici la mairie d'Épron.",
      source: { label: "Caen la mer, direction de l'urbanisme", url: "https://caenlamer.fr/annuaire-equipement/direction-urbanisme" },
    },
    risques: [
      {
        texte: "Géorisques signale un risque de remontée de nappe sur la commune, y compris dans le bourg : à vérifier à l'adresse du terrain avant de prévoir un sous-sol.",
        source: georisques("Épron", "14242"),
      },
      argiles("Épron", "14242", "faible"),
    ],
    patrimoine: [],
    communesVoisines: ["Caen", "Hérouville-Saint-Clair", "Biéville-Beuville", "Cambes-en-Plaine", "Saint-Contest"],
    faq: [
      faqPluiHm("Épron", "à Épron"),
      {
        q: "Quel délai pour un permis de maison à Épron ?",
        a: "Deux mois à compter du dépôt d'un dossier complet. Aucun monument historique n'est protégé sur la commune ; vérifiez toutefois que votre terrain n'est pas aux abords d'un monument d'une commune voisine, ce qui ajouterait un mois.",
      },
    ],
  },
  {
    slug: "mondeville",
    nom: "Mondeville",
    a: "à Mondeville",
    autour: "autour de Mondeville",
    departement: "14",
    intercommunalite: CAEN_LA_MER,
    pole: "caen",
    lastModified: REVUE,
    description:
      "Permis de construire de maison à Mondeville : PLU modifié en 2025, PPRN de l'Orne, PPRT du dépôt pétrolier, carrières. Dossier PCMI complet à prix fixe.",
    accroche:
      "À l'est de Caen, Mondeville a abrité environ 9 000 personnes dans ses carrières de la rue des Roches en 1944 ; elle cumule aujourd'hui risques d'inondation, industriels et souterrains.",
    urbanisme: {
      texte: "Mondeville a un PLU opposable depuis le 7 décembre 2016, modifié en 2019 et 2021 ; sa modification n° 3 a été approuvée par Caen la mer le 6 février 2025.",
      source: {
        label: "Géoportail de l'urbanisme, modification n° 3 du PLU de Mondeville",
        url: "https://data.geopf.fr/annexes/gpu/documents/DU_14437/3f33dfe78d4ca52527e77869f93af26b/14437_procedure_20250206.pdf",
      },
    },
    depot: {
      texte: `La ville renvoie vers ${GUICHET_CAEN_LA_MER} pour le dépôt en ligne et détaille sur la même page les pièces d'un permis de maison individuelle.`,
      source: { label: "Ville de Mondeville, travaux", url: "https://www.mondeville.fr/mes-demarches/urbanisme/travaux/" },
    },
    risques: [
      pprnOrne("Mondeville", "des inondations par débordement de cours d'eau et de la submersion marine"),
      {
        texte:
          "Le plan de prévention des risques technologiques du dépôt de liquides inflammables des Dépôts de Pétrole Côtiers, rue Gaston-Lamy, a été approuvé le 14 avril 2015 : il encadre la construction autour du site.",
        source: {
          label: "Géorisques, PPRT des Dépôts de Pétrole Côtiers de Mondeville",
          url: "https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprt/14DDTM20160002/document/00ad84e6-48b1-4021-b058-3a7288a9e2a2",
        },
      },
      cavitesRecensees("Mondeville", "14437", 6, ", d'anciennes carrières rue des Roches et à la Delle Saint-Martin"),
      {
        texte: "La ville publie avec son PLU des plans des risques naturels et littoraux au 1/5 000, utiles pour situer un terrain avant de lancer un projet.",
        source: { label: "Ville de Mondeville, plan local d'urbanisme", url: "https://www.mondeville.fr/les-docs/plan-local-durbanisme-plu/" },
      },
    ],
    patrimoine: [
      {
        texte:
          "La vieille église Notre-Dame-des-Prés, rue des Roches, est classée monument historique depuis 1913 : à ses abords, l'Architecte des Bâtiments de France donne son avis et l'instruction prend 3 mois.",
        source: { label: "Base Mérimée, vieille église Notre-Dame-des-Prés (PA00111555)", url: "https://pop.culture.gouv.fr/notice/merimee/PA00111555" },
      },
    ],
    communesVoisines: ["Caen", "Hérouville-Saint-Clair", "Colombelles", "Giberville", "Cormelles-le-Royal"],
    faq: [
      faqPluiHm("Mondeville", "à Mondeville"),
      {
        q: "Mon terrain est-il concerné par le dépôt pétrolier ?",
        a: "Seulement s'il est dans le périmètre du plan de prévention des risques technologiques autour du dépôt, rue Gaston-Lamy. Nous le vérifions sur la carte du plan avant de chiffrer : selon la zone, des règles de construction s'appliquent.",
      },
    ],
  },
];
