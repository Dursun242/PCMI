import { describe, expect, test } from "vitest";
import { DESCRIPTION_MAX, TITLE_MAX } from "../../scripts/seo/limits.mjs";
import { departementsFr, regions } from "@/config/territoires";
import {
  departementPath,
  departementsDe,
  getTerritoire,
  regionDe,
  territoireDescription,
  territoirePath,
  territoires,
  territoireSlug,
  territoireTitle,
} from "./territoires";

describe("régions et départements des plans gratuits", () => {
  test("France métropolitaine complète : 13 régions, 96 départements, codes uniques", () => {
    expect(regions).toHaveLength(13);
    expect(departementsFr).toHaveLength(96);
    expect(new Set(departementsFr.map((d) => d.code)).size).toBe(96);
  });

  test("chaque département appartient à une région connue, chaque région a des départements", () => {
    for (const d of departementsFr) expect(() => regionDe(d)).not.toThrow();
    for (const r of regions) expect(departementsDe(r).length).toBeGreaterThan(0);
  });

  test("tournures françaises du lieu", () => {
    for (const d of departementsFr) expect(d.dans).toMatch(/^(en |dans (le |la |les |l')|à )/);
    for (const r of regions) {
      expect(r.dans).toMatch(/^(en |dans (le |les ))/);
      expect(r.de).toMatch(/^(de |du |des |d')/);
    }
  });

  test("slugs uniques, propres, et sans collision avec /plans-gratuits/merci", () => {
    const slugs = territoires().map(territoireSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slugs).not.toContain("merci");
  });

  test("chaque slug retrouve son territoire", () => {
    for (const t of territoires()) expect(getTerritoire(territoireSlug(t))).toEqual(t);
    expect(getTerritoire("inconnu")).toBeUndefined();
  });

  test("exemples d'URL", () => {
    const d76 = departementsFr.find((d) => d.code === "76")!;
    const d2a = departementsFr.find((d) => d.code === "2A")!;
    expect(departementPath(d76)).toBe("/plans-gratuits/seine-maritime-76");
    expect(departementPath(d2a)).toBe("/plans-gratuits/corse-du-sud-2a");
    expect(territoirePath({ type: "region", region: regions.find((r) => r.slug === "normandie")! })).toBe(
      "/plans-gratuits/normandie",
    );
  });

  test("titres et descriptions uniques, dans les limites des moteurs, avec le lieu", () => {
    const titres = territoires().map(territoireTitle);
    const descriptions = territoires().map(territoireDescription);
    expect(new Set(titres).size).toBe(titres.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const t of titres) expect(t.length, t).toBeLessThanOrEqual(TITLE_MAX);
    for (const d of descriptions) expect(d.length, d).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(territoireTitle(getTerritoire("calvados-14")!)).toContain("dans le Calvados (14)");
  });
});
