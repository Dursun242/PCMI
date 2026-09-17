/**
 * Structure de la fiche projet complète, calquée sur les rubriques du CERFA n° 13406
 * (demande de permis de construire pour une maison individuelle et/ou ses annexes).
 * Chaque champ porte un identifiant stable : il sert de clé dans le JSON envoyé
 * avec l'e-mail (réutilisable par l'outil de génération PCMI).
 */
export type FieldType = "text" | "email" | "tel" | "number" | "date" | "select" | "radio" | "textarea" | "checkbox";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: [string, string][]; // [valeur, libellé]
  placeholder?: string;
  hint?: string;
  unit?: string;
  half?: boolean; // demi-largeur
  showIf?: { id: string; equals: string | string[] };
}

export interface Step {
  id: string;
  cerfa: string; // rubrique du CERFA
  title: string;
  intro?: string;
  fields: Field[];
}

const ouiNon: [string, string][] = [["oui", "Oui"], ["non", "Non"]];

export const steps: Step[] = [
  {
    id: "demandeur",
    cerfa: "Cadre 1",
    title: "Identité du demandeur",
    intro: "La personne (ou les personnes) au nom de qui le permis sera délivré.",
    fields: [
      { id: "type_demandeur", label: "Vous êtes", type: "radio", required: true, options: [["particulier", "Un particulier"], ["societe", "Une société (SCI, SARL…)"]] },
      { id: "civilite", label: "Civilité", type: "select", options: [["mme", "Madame"], ["m", "Monsieur"]], half: true },
      { id: "nom", label: "Nom", type: "text", required: true, half: true },
      { id: "prenom", label: "Prénom", type: "text", required: true, half: true },
      { id: "date_naissance", label: "Date de naissance", type: "date", half: true, hint: "Demandée par le CERFA pour un particulier." },
      { id: "raison_sociale", label: "Dénomination de la société", type: "text", showIf: { id: "type_demandeur", equals: "societe" }, half: true },
      { id: "siret", label: "N° SIRET", type: "text", showIf: { id: "type_demandeur", equals: "societe" }, half: true },
      { id: "email", label: "E-mail", type: "email", required: true, half: true },
      { id: "telephone", label: "Téléphone", type: "tel", required: true, half: true },
      { id: "adresse", label: "Adresse actuelle", type: "text", required: true, placeholder: "N°, voie" },
      { id: "cp_demandeur", label: "Code postal", type: "text", required: true, half: true },
      { id: "ville_demandeur", label: "Commune", type: "text", required: true, half: true },
      { id: "codemandeur", label: "Y a-t-il un co-demandeur (conjoint, associé) ?", type: "radio", options: ouiNon },
      { id: "codemandeur_identite", label: "Nom, prénom et date de naissance du co-demandeur", type: "text", showIf: { id: "codemandeur", equals: "oui" } },
    ],
  },
  {
    id: "terrain",
    cerfa: "Cadre 3",
    title: "Le terrain",
    intro: "Les références cadastrales figurent sur votre acte, votre promesse de vente ou sur cadastre.gouv.fr.",
    fields: [
      { id: "terrain_adresse", label: "Adresse du terrain", type: "text", required: true, placeholder: "N°, voie ou lieu-dit" },
      { id: "terrain_cp", label: "Code postal", type: "text", required: true, half: true },
      { id: "terrain_commune", label: "Commune", type: "text", required: true, half: true },
      { id: "cadastre_section", label: "Section cadastrale", type: "text", placeholder: "ex. AB", half: true },
      { id: "cadastre_numero", label: "Numéro(s) de parcelle", type: "text", placeholder: "ex. 123, 124", half: true },
      { id: "terrain_surface", label: "Superficie totale du terrain", type: "number", unit: "m²", required: true, half: true },
      { id: "terrain_situation", label: "Situation juridique", type: "select", required: true, half: true, options: [["proprietaire", "Propriétaire"], ["compromis", "Compromis ou promesse de vente signée"], ["recherche", "En cours d'acquisition"], ["autre", "Autre"]] },
      { id: "lotissement", label: "Le terrain est-il dans un lotissement ?", type: "radio", options: ouiNon, hint: "Si oui, le règlement et le cahier des charges du lotissement s'ajoutent au PLU." },
      { id: "cu", label: "Un certificat d'urbanisme a-t-il été délivré ?", type: "radio", options: ouiNon },
      { id: "cu_numero", label: "Numéro du certificat d'urbanisme", type: "text", showIf: { id: "cu", equals: "oui" }, half: true },
      { id: "terrain_pente", label: "Le terrain est-il en pente ?", type: "select", half: true, options: [["plat", "Plat ou quasi plat"], ["legere", "Pente légère"], ["forte", "Pente marquée"]] },
      { id: "terrain_borne", label: "Un plan de bornage ou un relevé de géomètre existe-t-il ?", type: "radio", options: ouiNon },
      { id: "terrain_protection", label: "Le terrain est-il en secteur protégé (abords de monument historique, site patrimonial, zone inondable) ?", type: "select", options: [["non", "Non, à ma connaissance"], ["abf", "Oui, avis de l'Architecte des Bâtiments de France"], ["ppri", "Oui, plan de prévention des risques"], ["inconnu", "Je ne sais pas"]] },
    ],
  },
  {
    id: "projet",
    cerfa: "Cadre 4",
    title: "Le projet",
    intro: "Décrivez la construction telle que vous l'imaginez aujourd'hui. Rien n'est définitif.",
    fields: [
      { id: "nature", label: "Nature des travaux", type: "select", required: true, options: [["neuve", "Construction d'une maison neuve"], ["extension", "Extension d'une maison existante"], ["surelevation", "Surélévation"], ["annexe", "Garage, abri, annexe"], ["demolition", "Démolition puis reconstruction"]] },
      { id: "description", label: "Description courte du projet", type: "textarea", required: true, placeholder: "ex. Maison de plain-pied, 3 chambres, toit plat, garage accolé, bardage bois et enduit blanc." },
      { id: "niveaux", label: "Nombre de niveaux", type: "select", half: true, options: [["1", "Plain-pied"], ["2", "R+1"], ["2c", "R + combles aménagés"], ["3", "R+2 ou plus"]] },
      { id: "chambres", label: "Nombre de chambres", type: "number", half: true },
      { id: "logements", label: "Nombre de logements créés", type: "number", half: true, hint: "1 dans la plupart des cas." },
      { id: "stationnement", label: "Places de stationnement prévues", type: "number", half: true },
      { id: "piscine", label: "Piscine prévue ?", type: "radio", options: ouiNon },
      { id: "demolition_partielle", label: "Démolition d'un bâtiment existant ?", type: "radio", options: ouiNon },
      { id: "arbres", label: "Abattage d'arbres nécessaire ?", type: "radio", options: ouiNon },
      { id: "style", label: "Style recherché", type: "select", options: [["contemporain", "Contemporain (toit plat, grandes baies)"], ["traditionnel", "Traditionnel (toiture à pentes, tuiles ou ardoises)"], ["mixte", "Mixte"], ["indifferent", "Je me laisse conseiller"]] },
    ],
  },
  {
    id: "surfaces",
    cerfa: "Cadre 5",
    title: "Surfaces et dimensions",
    intro: "Des ordres de grandeur suffisent. La surface de plancher détermine le seuil de l'architecte (150 m²).",
    fields: [
      { id: "sp_existante", label: "Surface de plancher existante", type: "number", unit: "m²", half: true, hint: "0 pour une construction neuve." },
      { id: "sp_creee", label: "Surface de plancher créée", type: "number", unit: "m²", required: true, half: true, hint: "Au-delà de 149 m² au total, permis sur devis avec architecte." },
      { id: "sp_demolie", label: "Surface de plancher démolie", type: "number", unit: "m²", half: true },
      { id: "emprise", label: "Emprise au sol du projet", type: "number", unit: "m²", half: true, hint: "Projection au sol de la maison, garage et terrasse couverte compris." },
      { id: "hauteur", label: "Hauteur maximale envisagée", type: "number", unit: "m", half: true, hint: "Au faîtage ou à l'acrotère." },
      { id: "budget", label: "Budget travaux envisagé", type: "select", half: true, options: [["", "Non communiqué"], ["<150", "Moins de 150 000 €"], ["150-250", "150 000 à 250 000 €"], ["250-400", "250 000 à 400 000 €"], [">400", "Plus de 400 000 €"]] },
    ],
  },
  {
    id: "materiaux",
    cerfa: "Cadre 4.3 / notice PCMI 4",
    title: "Aspect extérieur et raccordements",
    intro: "Ces éléments alimentent la notice descriptive et le contrôle du PLU (couleurs, matériaux, réseaux).",
    fields: [
      { id: "toiture", label: "Toiture", type: "select", half: true, options: [["plate", "Toit plat / toiture-terrasse"], ["tuiles", "Tuiles"], ["ardoises", "Ardoises"], ["zinc", "Zinc ou bac acier"], ["mixte", "Mixte"], ["indifferent", "À définir"]] },
      { id: "facades", label: "Façades", type: "select", half: true, options: [["enduit", "Enduit"], ["bardage_bois", "Bardage bois"], ["bardage_autre", "Bardage composite ou métal"], ["brique", "Brique ou pierre"], ["mixte", "Mixte"], ["indifferent", "À définir"]] },
      { id: "menuiseries", label: "Menuiseries", type: "select", half: true, options: [["alu", "Aluminium"], ["pvc", "PVC"], ["bois", "Bois"], ["indifferent", "À définir"]] },
      { id: "couleurs", label: "Couleurs souhaitées", type: "text", half: true, placeholder: "ex. enduit blanc cassé, menuiseries gris anthracite" },
      { id: "eau", label: "Eau potable", type: "select", half: true, options: [["reseau", "Raccordement au réseau"], ["inconnu", "Je ne sais pas"]] },
      { id: "assainissement", label: "Assainissement", type: "select", half: true, options: [["collectif", "Collectif (tout-à-l'égout)"], ["individuel", "Individuel (fosse, filtre)"], ["inconnu", "Je ne sais pas"]] },
      { id: "electricite", label: "Électricité", type: "select", half: true, options: [["reseau", "Raccordement au réseau"], ["inconnu", "Je ne sais pas"]] },
      { id: "pluviales", label: "Eaux pluviales", type: "select", half: true, options: [["infiltration", "Infiltration sur la parcelle"], ["reseau", "Rejet au réseau"], ["inconnu", "Je ne sais pas"]] },
      { id: "chauffage", label: "Chauffage envisagé", type: "select", options: [["pac", "Pompe à chaleur"], ["gaz", "Gaz"], ["bois", "Bois / granulés"], ["electrique", "Électrique"], ["indifferent", "À définir"]] },
    ],
  },
  {
    id: "mission",
    cerfa: "Cadre 2 / pièces jointes",
    title: "Votre attente et vos documents",
    intro: "Joignez ce que vous avez : plan du constructeur, croquis, esquisse Kasaplan, photos du terrain, plan de bornage, certificat d'urbanisme, acte ou compromis. Chaque document nous fait gagner du temps.",
    fields: [
      { id: "formule", label: "Formule envisagée", type: "radio", required: true, options: [["essentiel", "Essentiel — 1 490 € TTC"], ["complet", "Complet — 1 990 € TTC"], ["premium", "Premium — 2 990 € TTC"], ["conseil", "Conseillez-moi"]] },
      { id: "plans_existants", label: "Disposez-vous déjà de plans ?", type: "select", required: true, options: [["aucun", "Aucun plan"], ["croquis", "Un croquis ou une esquisse"], ["constructeur", "Des plans de constructeur"], ["kasaplan", "Une esquisse Kasaplan ou logiciel 3D"], ["dessinateur", "Des plans de dessinateur ou d'architecte"]] },
      { id: "constructeur", label: "Un constructeur ou un artisan est-il déjà choisi ?", type: "radio", options: ouiNon },
      { id: "delai", label: "Quand souhaitez-vous déposer le permis ?", type: "select", half: true, options: [["asap", "Dès que possible"], ["1-3", "Dans 1 à 3 mois"], ["3-6", "Dans 3 à 6 mois"], [">6", "Dans plus de 6 mois"]] },
      { id: "visio", label: "Créneau préféré pour un premier échange", type: "select", half: true, options: [["matin", "Matin"], ["midi", "Pause déjeuner"], ["apres-midi", "Après-midi"], ["soir", "Fin de journée"]] },
      { id: "message", label: "Précisions, contraintes, questions", type: "textarea", placeholder: "Voisinage, servitudes, contraintes de budget, points sur lesquels vous hésitez…" },
    ],
  },
];

/** Libellé lisible d'une valeur (pour l'e-mail). */
export function labelOf(field: Field, value: string) {
  if (!field.options) return value;
  return field.options.find(([v]) => v === value)?.[1] ?? value;
}
