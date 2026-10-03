import { departements, villes, type Departement, type Ville } from "@/config/normandie";

/** Racine des pages régionales. */
export const NORMANDIE_PATH = "/permis-de-construire-normandie";

export function villePath(v: Ville): string {
  return `${NORMANDIE_PATH}/${v.slug}`;
}

export function getVille(slug: string): Ville | undefined {
  return villes.find((v) => v.slug === slug);
}

export function departementDe(v: Ville): Departement {
  const d = departements.find((x) => x.code === v.departement);
  if (!d) throw new Error(`Département ${v.departement} inconnu pour ${v.slug}`);
  return d;
}

/** « Permis de construire maison au Havre (76) » : la requête locale telle qu'on la tape. */
export function villeTitle(v: Ville): string {
  return `Permis de construire maison ${v.a} (${v.departement})`;
}

/** Rédigée à la main par ville (≤ 160 caractères, vérifié par les tests). */
export function villeDescription(v: Ville): string {
  return v.description;
}

/** Villes d'un département, dans l'ordre de la liste (taille décroissante). */
export function villesDu(code: Departement["code"]): Ville[] {
  return villes.filter((v) => v.departement === code);
}
