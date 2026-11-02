import { HUB_PATH } from "@/config/planchesGratuites";
import { departementsFr, regions, type DepartementFr, type Region } from "@/config/territoires";

/** Limites des moteurs (scripts/seo/limits.mjs, vérifiées par le test). */
const TITLE_MAX = 65;
const DESCRIPTION_MAX = 160;

/** Slug d'URL : minuscules, sans accent, mots séparés par des tirets. */
export function slugifier(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function departementSlug(d: DepartementFr): string {
  return `${slugifier(d.nom)}-${d.code.toLowerCase()}`;
}

export type Territoire = { type: "region"; region: Region } | { type: "departement"; departement: DepartementFr };

export function territoireSlug(t: Territoire): string {
  return t.type === "region" ? t.region.slug : departementSlug(t.departement);
}

export function territoirePath(t: Territoire): string {
  return `${HUB_PATH}/${territoireSlug(t)}`;
}

export const regionPath = (r: Region): string => territoirePath({ type: "region", region: r });
export const departementPath = (d: DepartementFr): string => territoirePath({ type: "departement", departement: d });

export function territoires(): Territoire[] {
  return [
    ...regions.map((region) => ({ type: "region" as const, region })),
    ...departementsFr.map((departement) => ({ type: "departement" as const, departement })),
  ];
}

export function getTerritoire(slug: string): Territoire | undefined {
  return territoires().find((t) => territoireSlug(t) === slug);
}

export function regionDe(d: DepartementFr): Region {
  const r = regions.find((x) => x.slug === d.region);
  if (!r) throw new Error(`Région inconnue pour le département ${d.code} : ${d.region}`);
  return r;
}

export function departementsDe(r: Region): DepartementFr[] {
  return departementsFr.filter((d) => d.region === r.slug).sort((a, b) => a.code.localeCompare(b.code));
}

/** « en Seine-Maritime (76) » ; pour une région, « en Normandie ». */
export function lieu(t: Territoire): string {
  return t.type === "region" ? t.region.dans : `${t.departement.dans} (${t.departement.code})`;
}

export function nomTerritoire(t: Territoire): string {
  return t.type === "region" ? t.region.nom : t.departement.nom;
}

/** Le premier titre qui tient dans la limite des moteurs. */
function premierQuiTient(candidats: string[], max: number): string {
  return candidats.find((c) => c.length <= max) ?? candidats[candidats.length - 1];
}

export function territoireTitle(t: Territoire): string {
  const l = lieu(t);
  return premierQuiTient(
    [
      `Plan de masse gratuit ${l} : PCMI 2, DP2`,
      `Plan de masse gratuit ${l}`,
      `Plan de masse gratuit, ${nomTerritoire(t)}`,
    ],
    TITLE_MAX,
  );
}

export function territoireDescription(t: Territoire): string {
  const l = lieu(t);
  return premierQuiTient(
    [
      `Plans gratuits de votre terrain ${l} : plan de masse, de situation ou de coupe en PDF A3, d'après le cadastre et l'IGN, par e-mail.`,
      `Plans gratuits de votre terrain ${l} : masse, situation ou coupe en PDF A3, d'après le cadastre et l'IGN.`,
      `Plan de masse, de situation ou de coupe gratuit ${l}, en PDF A3.`,
    ],
    DESCRIPTION_MAX,
  );
}
