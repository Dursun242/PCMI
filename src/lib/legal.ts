import { site } from "@/config/site";

/**
 * Identité légale de l'éditeur, centralisée ici pour /mentions-legales et /cgv.
 * Les champs "TODO_…" sont à compléter avant mise en production : voir la
 * liste récapitulative en bas de fichier.
 */
export const legal = {
  raisonSociale: site.legal.company,
  forme: "SARL",
  capital: "TODO_CAPITAL_SOCIAL", // ex. "10 000 €"
  siren: site.legal.siren || "TODO_SIREN",
  siret: "TODO_SIRET", // SIREN + 5 chiffres de l'établissement
  rcs: site.legal.rcs,
  tva: site.legal.vat || "TODO_TVA_INTRACOM",
  email: site.email,
  telephone: site.phone,
  adresse: site.address,
  directeurPublication: site.legal.director,
  assurance: {
    assureur: site.legal.insurer || "TODO_ASSUREUR_RC_PRO",
    policeNumero: "TODO_NUMERO_POLICE_ASSURANCE",
  },
  mediateur: {
    nom: "TODO_NOM_MEDIATEUR_CONSOMMATION",
    adresse: "TODO_ADRESSE_MEDIATEUR",
    site: "TODO_URL_MEDIATEUR",
  },
  hebergeur: site.legal.host,
};

/** Vrai si la valeur n'a pas encore été renseignée. */
export function isTodo(value: string): boolean {
  return value.startsWith("TODO_");
}

/**
 * Champs à compléter avant mise en ligne des pages légales.
 * (Repris dans le rapport de fin de mission.)
 */
export const legalTodos = [
  "capital",
  "siren",
  "siret",
  "tva",
  "assurance.assureur",
  "assurance.policeNumero",
  "mediateur.nom",
  "mediateur.adresse",
  "mediateur.site",
] as const;
