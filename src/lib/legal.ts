import { site } from "@/config/site";

/**
 * Identité légale de l'éditeur, centralisée ici pour /mentions-legales et /cgv.
 * Les champs "TODO_…" sont à compléter avant mise en production : voir la
 * liste récapitulative en bas de fichier.
 */
export const legal = {
  raisonSociale: site.legal.company,
  forme: "SARL",
  capital: "1 000 €", // source : societe.com / Pappers / Annuaire des Entreprises
  siren: site.legal.siren || "TODO_SIREN",
  siret: "921 536 181 00024", // siège, source : Annuaire des Entreprises / RubyPayeur
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
  "assurance.assureur",
  "assurance.policeNumero",
  "mediateur.nom",
  "mediateur.adresse",
  "mediateur.site",
] as const;
