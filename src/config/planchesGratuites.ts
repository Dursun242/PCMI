import type { Planche } from "@/lib/planche";

/**
 * Textes des trois pages de la planche gratuite. Chaque page vise sa propre
 * recherche (« plan de masse gratuit », « coupe de terrain », « plan de
 * situation gratuit ») et propose les trois planches : une seule par terrain.
 */

export interface PagePlanche {
  planche: Planche;
  path: string;
  /** Titre de l'onglet et des moteurs (≤ 60 caractères). */
  metaTitre: string;
  description: string;
  h1: string;
  /** Premier paragraphe : il répond à la question de la page. */
  chapo: string;
  /** Fil d'Ariane. */
  court: string;
  montre: string[];
  sections: { titre: string; paragraphes: string[] }[];
  faq: { q: string; a: string }[];
}

const FAQ_COMMUNE: { q: string; a: string }[] = [
  {
    q: "Pourquoi une seule planche par terrain ?",
    a: "C'est un service offert par notre bureau d'études pour vous aider à démarrer. Chaque parcelle a droit à une planche gratuite, au choix : plan de situation, plan de masse de l'existant ou coupes du terrain. Les autres plans font partie de nos formules de permis à prix fixe.",
  },
  {
    q: "En combien de temps je reçois la planche ?",
    a: "En général quelques minutes après votre demande, par e-mail, en PDF au format A3. Si votre terrain demande une vérification, nous la finalisons nous-mêmes et vous l'envoyons sous 24 h ouvrées.",
  },
  {
    q: "Que faites-vous de mes coordonnées ?",
    a: "Elles servent à vous envoyer la planche et à vous recontacter au sujet de votre projet. Elles ne sont ni vendues ni cédées. Vous pouvez demander leur suppression à tout moment.",
  },
];

export const PAGES_PLANCHES: Record<Planche, PagePlanche> = {
  masse: {
    planche: "masse",
    path: "/plan-de-masse-gratuit",
    metaTitre: "Plan de masse gratuit de votre terrain (existant)",
    description:
      "Recevez gratuitement le plan de masse de l'existant de votre terrain : limites cotées, surface, bâti, voie et altitudes. PDF A3 dessiné par un bureau d'études.",
    h1: "Plan de masse gratuit de votre terrain",
    chapo:
      "Saisissez l'adresse de votre terrain : notre bureau d'études vous envoie par e-mail son plan de masse de l'existant, au format A3, établi d'après le cadastre et les altitudes de l'IGN. C'est gratuit, une planche par terrain.",
    court: "Plan de masse gratuit",
    montre: [
      "Les limites du terrain cotées et sa contenance cadastrale",
      "Les bâtiments existants, la voie d'accès et les parcelles voisines",
      "Des points d'altitude du terrain naturel (NGF)",
      "Le nord, l'échelle et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "À quoi sert le plan de masse de l'existant",
        paragraphes: [
          "C'est le point de départ de tout projet : on y voit la forme exacte du terrain, la place disponible et ce qui existe déjà. Il vous sert à réfléchir à l'implantation de votre maison, à en parler avec un constructeur ou un artisan, et à préparer vos questions pour la mairie.",
          "Dans un dossier de permis, la pièce PCMI 2 montre en plus la construction projetée, ses distances aux limites, les accès, les réseaux et les plantations. Ce plan-là, nous le dessinons dans nos formules à prix fixe.",
        ],
      },
      {
        titre: "Ce qu'il ne remplace pas",
        paragraphes: [
          "Le cadastre n'est pas un bornage : ses limites peuvent s'écarter du terrain réel de quelques décimètres, parfois davantage, et les altitudes de l'IGN sont précises à 0,2 à 0,5 m. Pour une vente, un bornage ou un terrain très pentu, le plan d'un géomètre fait foi.",
        ],
      },
    ],
    faq: [
      {
        q: "Le plan de masse gratuit suffit-il pour déposer un permis ?",
        a: "Non. Il montre le terrain tel qu'il est aujourd'hui. Le plan de masse du permis (PCMI 2) doit aussi représenter la maison projetée, ses distances aux limites, ses accès, ses raccordements et les arbres conservés ou plantés.",
      },
      ...FAQ_COMMUNE,
    ],
  },
  coupes: {
    planche: "coupes",
    path: "/coupe-de-terrain-gratuite",
    metaTitre: "Coupe de terrain gratuite : profil en long et en travers",
    description:
      "Recevez gratuitement les coupes de votre terrain dans les deux sens : profil du terrain naturel, altitudes NGF et pente. PDF A3 dessiné par un bureau d'études.",
    h1: "Coupes de terrain gratuites, dans les deux sens",
    chapo:
      "Saisissez l'adresse de votre terrain : nous vous envoyons par e-mail ses deux coupes, en long et en travers, avec les altitudes du terrain naturel et la pente, établies d'après les données de l'IGN. C'est gratuit, une planche par terrain.",
    court: "Coupes de terrain gratuites",
    montre: [
      "Deux coupes du terrain naturel, dans son axe long et dans son axe court",
      "Les altitudes NGF mètre après mètre et la pente moyenne",
      "Les limites de propriété repérées sur chaque profil",
      "Un plan de repérage des coupes et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "Pourquoi regarder la pente avant de dessiner",
        paragraphes: [
          "Un terrain qui paraît plat à l'œil peut descendre d'un mètre ou plus d'une limite à l'autre. La pente décide du calage de la maison, des marches d'accès, du garage, de l'écoulement des eaux de pluie et parfois du coût des fondations.",
          "Dans le dossier de permis, la pièce PCMI 3 montre la maison posée sur ce profil, avec le terrain avant et après travaux. Nous la dessinons dans nos formules à prix fixe.",
        ],
      },
      {
        titre: "Précision des altitudes",
        paragraphes: [
          "Les altitudes viennent du modèle de terrain RGE ALTI de l'IGN, au mètre, précis à 0,2 à 0,5 m. C'est suffisant pour comprendre un terrain et préparer un projet ; pour un terrain très pentu ou un projet en limite, le relevé d'un géomètre fait foi.",
        ],
      },
    ],
    faq: [
      {
        q: "La coupe de terrain gratuite suffit-elle pour le permis ?",
        a: "Non. Le plan en coupe du permis (PCMI 3) doit montrer la construction projetée dans le terrain, avec le profil avant et après travaux. La coupe gratuite donne le terrain naturel, qui sert de base à ce dessin.",
      },
      ...FAQ_COMMUNE,
    ],
  },
  situation: {
    planche: "situation",
    path: "/plan-de-situation-gratuit",
    metaTitre: "Plan de situation gratuit pour votre terrain (PDF A3)",
    description:
      "Recevez gratuitement le plan de situation de votre terrain : repérage dans la commune et le quartier, extrait cadastral, nord et échelles. PDF A3 gratuit.",
    h1: "Plan de situation gratuit de votre terrain",
    chapo:
      "Saisissez l'adresse de votre terrain : nous vous envoyons par e-mail son plan de situation, au format A3, avec le terrain repéré dans la commune, dans le quartier et sur l'extrait cadastral. C'est gratuit, une planche par terrain.",
    court: "Plan de situation gratuit",
    montre: [
      "Le terrain dans la commune, au 1/25 000",
      "Le terrain dans son quartier, au 1/5 000",
      "L'extrait cadastral avec la parcelle surlignée",
      "La référence cadastrale, la contenance et un cartouche à votre nom",
    ],
    sections: [
      {
        titre: "Le plan de situation, première pièce du permis",
        paragraphes: [
          "Dans un dossier de permis de construire de maison, c'est la pièce PCMI 1 : elle permet au service instructeur de localiser le terrain dans la commune, de savoir s'il est en zone protégée et quelles règles s'appliquent.",
          "La planche gratuite porte une mention « document indicatif » et notre filigrane : elle sert à préparer votre projet. La version à déposer, sans filigrane, fait partie de nos formules de permis à prix fixe, avec les sept autres pièces.",
        ],
      },
    ],
    faq: [
      {
        q: "Puis-je déposer ce plan de situation avec mon permis ?",
        a: "La planche gratuite porte un filigrane et la mention « document indicatif » : elle sert à préparer le projet. Le plan de situation à déposer est inclus dans nos formules, avec les sept autres pièces du dossier.",
      },
      ...FAQ_COMMUNE,
    ],
  },
};
