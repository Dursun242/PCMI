import type { Planche } from "@/lib/planche";

/**
 * Textes des pages « plans gratuits » : une page d'accueil (/plans-gratuits)
 * et une page par planche. Chaque page vise sa propre famille de recherches
 * (« plan de masse gratuit », « plan de situation gratuit », « plan de coupe
 * gratuit », avec leurs variantes PCMI, PC et DP) et propose les trois
 * planches : une seule par terrain.
 *
 * Les mots-clés sont placés là où un lecteur les attend (titre, chapô,
 * intertitres, questions) : une page écrite pour Google et illisible pour un
 * humain ne se classe pas, et ne convertit pas.
 */

export interface PagePlanche {
  planche: Planche;
  path: string;
  /** Titre de l'onglet et des moteurs (≤ 65 caractères). */
  metaTitre: string;
  /** Description des moteurs (≤ 160 caractères). */
  description: string;
  h1: string;
  /** Premier paragraphe : il répond à la question de la page. */
  chapo: string;
  /** Fil d'Ariane et liens internes. */
  court: string;
  montre: string[];
  sections: { titre: string; paragraphes: string[] }[];
  faq: { q: string; a: string }[];
}

export const HUB_PATH = "/plans-gratuits";

/** Les projets pour lesquels on cherche ces plans : une phrase commune aux trois pages. */
const PROJETS =
  "Maison neuve, extension, agrandissement, garage, carport, piscine, abri de jardin, véranda, terrasse surélevée, clôture ou mur de soutènement : tous ces projets passent par une demande de permis de construire ou une déclaration préalable de travaux, et toutes deux commencent par l'état existant du terrain.";

const FAQ_COMMUNE: { q: string; a: string }[] = [
  {
    q: "Pourquoi une seule planche gratuite par terrain ?",
    a: "C'est un service offert par notre bureau d'études pour vous aider à démarrer. Chaque parcelle a droit à une planche gratuite, au choix : plan de situation, plan de masse de l'existant ou plan de coupe du terrain. Les autres plans font partie de nos formules de permis à prix fixe.",
  },
  {
    q: "En combien de temps je reçois le plan ?",
    a: "En général deux à trois minutes après votre demande, par e-mail, en PDF au format A3 prêt à imprimer. Si votre terrain demande une vérification, nous la finalisons nous-mêmes et vous l'envoyons sous 24 h ouvrées.",
  },
  {
    q: "Le service fonctionne-t-il partout en France ?",
    a: "Oui, pour tout terrain cadastré en France métropolitaine : il suffit de saisir l'adresse puis de confirmer la parcelle sur la photo aérienne. Le plan est établi d'après le cadastre et les données de l'IGN.",
  },
  {
    q: "Que faites-vous de mes coordonnées ?",
    a: "Elles servent à vous envoyer le plan et à vous recontacter au sujet de votre projet. Elles ne sont ni vendues ni cédées. Vous pouvez demander leur suppression à tout moment.",
  },
];

export const PAGES_PLANCHES: Record<Planche, PagePlanche> = {
  masse: {
    planche: "masse",
    path: "/plan-de-masse-gratuit",
    metaTitre: "Plan de masse gratuit en ligne : PCMI 2, PC2, DP2 (PDF A3)",
    description:
      "Plan de masse gratuit de votre terrain en PDF A3 : limites cotées, surface, bâti et altitudes. Base du PCMI 2 ou du DP2, dessiné par un bureau d'études.",
    h1: "Plan de masse gratuit de votre terrain",
    chapo:
      "Saisissez l'adresse de votre terrain : notre bureau d'études vous envoie par e-mail son plan de masse de l'existant, au format A3, établi d'après le cadastre et les altitudes de l'IGN. C'est la base du plan de masse de votre permis de construire (PCMI 2 ou PC2) ou de votre déclaration préalable (DP2). Gratuit, une planche par terrain.",
    court: "Plan de masse gratuit",
    montre: [
      "Les limites du terrain cotées et sa contenance cadastrale en m²",
      "Les bâtiments existants, la voie d'accès et les parcelles voisines",
      "Des points d'altitude du terrain naturel (NGF)",
      "Le nord, l'échelle graphique et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "Qu'est-ce qu'un plan de masse ?",
        paragraphes: [
          "Le plan de masse est la vue de dessus du terrain, à l'échelle : on y voit sa forme exacte, ses dimensions, ce qui est déjà construit, la voie d'accès et les terrains voisins. C'est le plan que la mairie regarde en premier pour vérifier où se place une construction et à quelle distance des limites.",
          "Dans un dossier de permis de construire de maison individuelle, il porte le numéro PCMI 2 (PC2 pour les autres permis). Dans une déclaration préalable de travaux, c'est la pièce DP2. Le contenu est le même : le terrain, le projet coté, les accès, les raccordements aux réseaux et les plantations.",
        ],
      },
      {
        titre: "Pourquoi commencer par le plan de masse de l'existant",
        paragraphes: [
          "Avant de dessiner une maison ou une extension, il faut connaître la place réellement disponible. Le plan de masse de l'existant montre la surface du terrain, la longueur de chaque limite, la largeur de la façade sur rue et la pente. Avec lui, vous pouvez tester l'implantation, vérifier les reculs imposés par le PLU et en parler sérieusement avec un constructeur, un artisan ou le service urbanisme de la mairie.",
          "C'est aussi le bon document pour juger un terrain à bâtir avant de l'acheter : forme, orientation, accès, voisinage et dénivelé apparaissent d'un coup d'œil.",
        ],
      },
      {
        titre: "Pour quel projet ?",
        paragraphes: [
          PROJETS,
          "Pour une piscine, un abri de jardin ou une extension, la déclaration préalable demande un plan de masse (DP2) qui montre le projet dans le terrain existant : notre planche gratuite en est le fond. Il ne reste qu'à y placer votre construction et ses distances aux limites.",
        ],
      },
      {
        titre: "Comment faire un plan de masse à partir du cadastre",
        paragraphes: [
          "On peut partir de l'extrait cadastral (cadastre.gouv.fr ou Géoportail), mais il faut alors redessiner les limites à l'échelle, les coter, ajouter le bâti, les voisins, le nord et les altitudes. Notre outil le fait pour vous : il lit le cadastre, les bâtiments et le relief de l'IGN, puis dessine une planche cotée à l'échelle, prête à imprimer en A3.",
          "Ensuite, le plan de masse du permis (PCMI 2) ajoute la maison projetée, ses cotes, les distances aux limites, l'accès, le stationnement, les réseaux et les arbres. Ce plan-là, nous le dessinons dans nos formules à prix fixe.",
        ],
      },
      {
        titre: "Ce que le plan gratuit ne remplace pas",
        paragraphes: [
          "Le cadastre n'est pas un bornage : ses limites peuvent s'écarter du terrain réel de quelques décimètres, parfois davantage, et les altitudes de l'IGN sont précises à 0,2 à 0,5 m. Pour une vente, un bornage, une division parcellaire ou un terrain très pentu, le plan d'un géomètre-expert fait foi.",
        ],
      },
    ],
    faq: [
      {
        q: "Le plan de masse gratuit suffit-il pour déposer un permis de construire ?",
        a: "Non. Il montre le terrain tel qu'il est aujourd'hui. Le plan de masse du permis (PCMI 2) doit aussi représenter la maison projetée, ses distances aux limites, ses accès, ses raccordements et les arbres conservés ou plantés. Notre planche en est la base.",
      },
      {
        q: "Quelle est la différence entre PCMI 2, PC2 et DP2 ?",
        a: "C'est la même pièce, le plan de masse, dans trois dossiers différents : PCMI 2 pour le permis de construire d'une maison individuelle, PC2 pour les autres permis de construire, DP2 pour une déclaration préalable de travaux (extension, piscine, abri de jardin, clôture…).",
      },
      {
        q: "À quelle échelle doit être un plan de masse ?",
        a: "Le plus souvent au 1/200 ou au 1/250, parfois au 1/500 pour un grand terrain et au 1/100 pour un petit projet. L'important est que l'échelle soit indiquée et que les cotes soient lisibles. Notre planche porte une échelle graphique et l'échelle numérique dans le cartouche.",
      },
      {
        q: "Qui peut faire un plan de masse ?",
        a: "Vous pouvez le dessiner vous-même. Un maître d'œuvre, un architecte, un dessinateur ou un géomètre peuvent aussi le faire. Au-delà de 150 m² de surface de plancher, l'architecte est obligatoire pour l'ensemble du permis.",
      },
      ...FAQ_COMMUNE,
    ],
  },
  coupes: {
    planche: "coupes",
    path: "/plan-de-coupe-gratuit",
    metaTitre: "Plan de coupe gratuit du terrain : PCMI 3, PC3, DP3 (PDF A3)",
    description:
      "Plan de coupe gratuit de votre terrain en PDF A3 : profils en long et en travers, altitudes NGF, pente. Base du PCMI 3 ou du DP3, par un bureau d'études.",
    h1: "Plan de coupe gratuit de votre terrain",
    chapo:
      "Saisissez l'adresse de votre terrain : nous vous envoyons par e-mail ses deux coupes, en long et en travers, avec les altitudes du terrain naturel et la pente, établies d'après les données de l'IGN. C'est la base du plan en coupe de votre permis de construire (PCMI 3 ou PC3) ou de votre déclaration préalable (DP3). Gratuit, une planche par terrain.",
    court: "Plan de coupe gratuit",
    montre: [
      "Deux coupes du terrain naturel, dans son axe long et dans son axe court",
      "Les altitudes NGF mètre après mètre et la pente moyenne",
      "Les limites de propriété repérées sur chaque profil",
      "Un plan de repérage des coupes et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "Qu'est-ce qu'un plan de coupe ?",
        paragraphes: [
          "Le plan en coupe, ou plan de coupe, montre le terrain comme si on le tranchait verticalement : on voit son profil, ses pentes et ses différences de hauteur. Dans un dossier de permis, il montre aussi la construction posée dans ce terrain, avec le terrain naturel avant travaux et le terrain fini après travaux.",
          "C'est la pièce PCMI 3 du permis de construire de maison individuelle, PC3 pour les autres permis, et DP3 dans une déclaration préalable quand le projet modifie le profil du terrain.",
        ],
      },
      {
        titre: "Pourquoi regarder la pente avant de dessiner",
        paragraphes: [
          "Un terrain qui paraît plat à l'œil peut descendre d'un mètre ou plus d'une limite à l'autre. La pente décide du calage de la maison, des marches d'accès, de la rampe du garage, de l'écoulement des eaux de pluie, des remblais et des déblais, et parfois du coût des fondations.",
          "Le PLU limite souvent la hauteur des constructions par rapport au terrain naturel : sans coupe du terrain, impossible de savoir combien de hauteur il vous reste.",
        ],
      },
      {
        titre: "Pour quel projet ?",
        paragraphes: [
          PROJETS,
          "Le plan en coupe est indispensable dès que le terrain est en pente, pour une maison sur sous-sol, un garage enterré, une piscine creusée, un mur de soutènement ou une terrasse surélevée.",
        ],
      },
      {
        titre: "Comment faire un plan de coupe de terrain",
        paragraphes: [
          "Il faut connaître l'altitude du terrain en plusieurs points le long d'une ligne, puis la reporter à l'échelle. Notre outil lit le modèle de terrain RGE ALTI de l'IGN au mètre et trace deux profils : l'un dans la plus grande longueur du terrain, l'autre en travers. Les limites de propriété et la pente moyenne y sont repérées.",
          "Le plan en coupe du permis (PCMI 3) ajoute la maison, ses niveaux, sa hauteur à l'égout et au faîtage, et le terrain après travaux. Nous le dessinons dans nos formules à prix fixe.",
        ],
      },
      {
        titre: "Précision des altitudes",
        paragraphes: [
          "Les altitudes viennent du modèle de terrain RGE ALTI de l'IGN, au mètre, précis à 0,2 à 0,5 m. C'est suffisant pour comprendre un terrain et préparer un projet ; pour un terrain très pentu ou un projet en limite, le relevé topographique d'un géomètre fait foi.",
        ],
      },
    ],
    faq: [
      {
        q: "Le plan de coupe gratuit suffit-il pour le permis de construire ?",
        a: "Non. Le plan en coupe du permis (PCMI 3) doit montrer la construction projetée dans le terrain, avec le profil avant et après travaux. La coupe gratuite donne le terrain naturel, qui sert de base à ce dessin.",
      },
      {
        q: "Quelle est la différence entre PCMI 3, PC3 et DP3 ?",
        a: "C'est la même pièce, le plan en coupe du terrain et de la construction, dans trois dossiers : PCMI 3 pour une maison individuelle, PC3 pour les autres permis de construire, DP3 pour une déclaration préalable lorsque les travaux modifient le profil du terrain.",
      },
      {
        q: "Un plan en coupe est-il obligatoire si mon terrain est plat ?",
        a: "Pour un permis de construire de maison, oui : la pièce PCMI 3 est toujours demandée. Pour une déclaration préalable, le DP3 n'est exigé que si le projet modifie le profil du terrain (remblai, déblai, construction enterrée).",
      },
      {
        q: "À quelle échelle se dessine un plan de coupe ?",
        a: "Le plus souvent au 1/100, parfois au 1/50 pour un petit projet ou au 1/200 pour un long terrain. Notre planche indique l'échelle et cote les altitudes, ce qui permet de lire la pente sans règle.",
      },
      ...FAQ_COMMUNE,
    ],
  },
  situation: {
    planche: "situation",
    path: "/plan-de-situation-gratuit",
    metaTitre: "Plan de situation gratuit : PCMI 1, PC1, DP1 en PDF A3",
    description:
      "Plan de situation gratuit en PDF A3 : terrain repéré dans la commune, le quartier et sur l'extrait cadastral. Modèle du PCMI 1 ou du DP1, envoyé par e-mail.",
    h1: "Plan de situation gratuit de votre terrain",
    chapo:
      "Saisissez l'adresse de votre terrain : nous vous envoyons par e-mail son plan de situation, au format A3, avec le terrain repéré dans la commune, dans le quartier et sur l'extrait cadastral. C'est le modèle de la première pièce de votre permis de construire (PCMI 1 ou PC1) ou de votre déclaration préalable (DP1). Gratuit, une planche par terrain.",
    court: "Plan de situation gratuit",
    montre: [
      "Le terrain dans la commune, au 1/25 000",
      "Le terrain dans son quartier, au 1/5 000",
      "L'extrait cadastral avec la parcelle surlignée",
      "La référence cadastrale, la contenance et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "Qu'est-ce qu'un plan de situation ?",
        paragraphes: [
          "Le plan de situation permet de localiser le terrain : où il se trouve dans la commune, dans quel quartier, le long de quelle rue. Il porte le nord, l'échelle et le repérage de la parcelle, pour que le service instructeur sache tout de suite de quel terrain il s'agit et quelles règles s'appliquent (zone du PLU, secteur protégé, risques).",
          "C'est la pièce PCMI 1 d'un permis de construire de maison individuelle, PC1 pour les autres permis, et DP1 dans une déclaration préalable de travaux.",
        ],
      },
      {
        titre: "Le plan de situation, première pièce du dossier",
        paragraphes: [
          "Il ouvre le bordereau des pièces et c'est souvent le premier plan que l'on cherche à faire. Notre planche réunit trois vues sur une seule feuille A3 : la commune au 1/25 000, le quartier au 1/5 000 et l'extrait cadastral, avec la parcelle surlignée et sa référence.",
          "La planche gratuite porte une mention « document indicatif » et notre filigrane : elle sert à préparer votre projet. La version à déposer, sans filigrane, fait partie de nos formules de permis à prix fixe, avec les sept autres pièces.",
        ],
      },
      {
        titre: "Pour quel projet ?",
        paragraphes: [
          PROJETS,
          "Le plan de situation est demandé dans tous les cas : permis de construire, permis d'aménager, déclaration préalable, et même pour une demande de certificat d'urbanisme.",
        ],
      },
      {
        titre: "Comment faire un plan de situation",
        paragraphes: [
          "On peut l'assembler soi-même à partir de Géoportail ou du cadastre : imprimer une carte de la commune, une vue plus rapprochée, repérer le terrain, ajouter le nord et l'échelle. Notre outil le fait pour vous à partir de l'adresse : vous confirmez la parcelle sur la photo aérienne, la planche arrive par e-mail quelques minutes plus tard.",
        ],
      },
    ],
    faq: [
      {
        q: "Puis-je déposer ce plan de situation avec mon permis de construire ?",
        a: "La planche gratuite porte un filigrane et la mention « document indicatif » : elle sert à préparer le projet. Le plan de situation à déposer est inclus dans nos formules, avec les sept autres pièces du dossier.",
      },
      {
        q: "Quelle est la différence entre PCMI 1, PC1 et DP1 ?",
        a: "C'est la même pièce, le plan de situation du terrain, dans trois dossiers : PCMI 1 pour le permis de construire d'une maison individuelle, PC1 pour les autres permis, DP1 pour une déclaration préalable de travaux.",
      },
      {
        q: "À quelle échelle doit être le plan de situation ?",
        a: "Il n'y a pas d'échelle imposée : on utilise couramment le 1/25 000 pour la commune et le 1/5 000 ou le 1/2 000 pour le quartier. L'essentiel est que le terrain soit facile à trouver et que le nord soit indiqué.",
      },
      {
        q: "Plan de situation, plan cadastral : quelle différence ?",
        a: "Le plan cadastral montre les parcelles et leurs numéros, sans la vue d'ensemble de la commune. Le plan de situation situe le terrain à plusieurs échelles ; il contient souvent un extrait cadastral, comme notre planche.",
      },
      ...FAQ_COMMUNE,
    ],
  },
};

/** Textes de la page d'accueil des plans gratuits. */
export const HUB = {
  path: HUB_PATH,
  metaTitre: "Plans gratuits permis de construire : situation, masse, coupe",
  description:
    "Plan de situation, de masse ou de coupe gratuit de votre terrain en PDF A3 : base des pièces PCMI 1, 2, 3 ou DP1, 2, 3. Une planche offerte par terrain.",
  h1: "Plans gratuits pour votre permis de construire",
  chapo:
    "Un projet de maison, d'extension, de piscine ou d'abri de jardin commence toujours par les plans du terrain. Notre bureau d'études vous offre l'un des trois, au choix : plan de situation, plan de masse ou plan de coupe, en PDF A3, établi d'après le cadastre et l'IGN. Une planche gratuite par terrain.",
  court: "Plans gratuits",
  faq: [
    {
      q: "Quel plan choisir en premier ?",
      a: "Le plan de masse si vous voulez savoir quelle place vous avez pour construire ; le plan de coupe si le terrain est en pente ; le plan de situation si vous montez vous-même votre dossier et voulez la première pièce. Vous ne pouvez en recevoir qu'un par terrain.",
    },
    {
      q: "Quels plans faut-il pour un permis de construire de maison ?",
      a: "Huit pièces obligatoires : plan de situation (PCMI 1), plan de masse (PCMI 2), plan en coupe (PCMI 3), notice (PCMI 4), façades et toitures (PCMI 5), insertion graphique (PCMI 6) et deux photos (PCMI 7 et 8). Les trois premières sont les plans du terrain.",
    },
    {
      q: "Et pour une déclaration préalable de travaux ?",
      a: "Les mêmes plans portent les numéros DP1 (situation), DP2 (masse) et DP3 (coupe, si le terrain est modifié). Notre planche gratuite sert de base à l'une ou l'autre de ces pièces.",
    },
    ...FAQ_COMMUNE,
  ],
};

/** Correspondance des pièces : permis de maison, autres permis, déclaration préalable. */
export const CORRESPONDANCE_PIECES: { planche: Planche; nom: string; pcmi: string; pc: string; dp: string }[] = [
  { planche: "situation", nom: "Plan de situation", pcmi: "PCMI 1", pc: "PC1", dp: "DP1" },
  { planche: "masse", nom: "Plan de masse", pcmi: "PCMI 2", pc: "PC2", dp: "DP2" },
  { planche: "coupes", nom: "Plan en coupe", pcmi: "PCMI 3", pc: "PC3", dp: "DP3" },
];
