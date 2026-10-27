import { describe, expect, test } from "vitest";
import { TITLE_MAX } from "../../scripts/seo/limits.mjs";
import { departements, villes } from "@/config/normandie";
import { communesAutour, getVille, poleDe, villeDescription, villePath, villeTitle, villesDu } from "./normandie";

const DESCRIPTION_MAX = 160;

describe("données des villes de Normandie", () => {
  test("chaque ville a un slug unique, en minuscules sans accent", () => {
    const slugs = villes.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("chaque ville appartient à un département décrit", () => {
    const codes = departements.map((d) => d.code);
    for (const v of villes) expect(codes).toContain(v.departement);
  });

  test("chaque fait réglementaire cite une source officielle ou vérifiable en https", () => {
    for (const v of villes) {
      const faits = [v.urbanisme, v.depot, ...v.risques, ...v.patrimoine, ...(v.architecture ? [v.architecture] : [])];
      for (const f of faits) {
        expect(f.texte.length, `${v.slug} : fait vide`).toBeGreaterThan(20);
        expect(f.source.url, `${v.slug} : « ${f.texte.slice(0, 40)}… » sans source`).toMatch(/^https:\/\//);
      }
    }
  });

  test("chaque page a assez de contenu propre pour ne pas être une page « ville » dupliquée", () => {
    for (const v of villes) {
      const specifiques = v.risques.length + v.patrimoine.length + (v.architecture ? 1 : 0);
      expect(specifiques, `${v.slug} : trop peu d'éléments locaux`).toBeGreaterThanOrEqual(2);
      expect(v.communesVoisines.length, `${v.slug} : communes voisines`).toBeGreaterThanOrEqual(2);
      expect(v.faq.length, `${v.slug} : FAQ locale`).toBeGreaterThanOrEqual(2);
    }
    const accroches = villes.map((v) => v.accroche);
    expect(new Set(accroches).size).toBe(accroches.length);
  });
});

describe("communes de la périphérie des agglomérations", () => {
  test("chaque commune est rattachée à une ville principale du même département", () => {
    for (const v of villes.filter((x) => x.pole)) {
      const pole = getVille(v.pole as string);
      expect(pole, `${v.slug} : pôle « ${v.pole} » inconnu`).toBeDefined();
      expect(pole?.pole, `${v.slug} : le pôle doit être une ville principale`).toBeUndefined();
      expect(pole?.departement, `${v.slug} : département du pôle`).toBe(v.departement);
    }
  });

  test("la ville principale et ses communes se renvoient l'une vers l'autre", () => {
    for (const v of villes.filter((x) => x.pole)) {
      const pole = getVille(v.pole as string)!;
      expect(communesAutour(pole)).toContain(v);
      expect(poleDe(v)).toBe(pole);
      expect(villesDu(v.departement)).not.toContain(v);
    }
  });

  test("une date de revue propre à la page est au format AAAA-MM-JJ", () => {
    for (const v of villes) if (v.lastModified) expect(v.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("métadonnées des pages villes", () => {
  test("titre sous la limite Google et description sous 160 caractères", () => {
    for (const v of villes) {
      expect(villeTitle(v).length, villeTitle(v)).toBeLessThanOrEqual(TITLE_MAX);
      expect(villeDescription(v).length, villeDescription(v)).toBeLessThanOrEqual(DESCRIPTION_MAX);
      // « au Havre », « à Rouen » : la forme avec préposition, jamais « à Le Havre ».
      expect(villeTitle(v)).toContain(v.a);
      expect(v.a).toMatch(/^(à|au|aux) /);
    }
  });

  test("le chemin et la recherche par slug sont cohérents", () => {
    const v = villes[0];
    expect(villePath(v)).toBe(`/permis-de-construire-normandie/${v.slug}`);
    expect(getVille(v.slug)).toBe(v);
    expect(getVille("inconnue")).toBeUndefined();
  });
});
