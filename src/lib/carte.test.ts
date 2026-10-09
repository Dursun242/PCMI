import { describe, expect, test } from "vitest";
import carte from "@/config/carte-le-havre.json";
import { chantiers } from "@/config/references";
import {
  communeDeCarte,
  classeCommune,
  communesAvecChantier,
  pointsPublics,
  projeter,
  vueEnsemble,
  type FondDeCarte,
} from "./carte";

const fond = carte as FondDeCarte;

describe("projeter", () => {
  test("reprend la projection de l'ancienne page (coin nord-ouest = origine)", () => {
    expect(projeter(fond, fond.box[0], fond.box[3])).toEqual([0, 0]);
  });

  test("place Le Havre dans le cadre de la carte", () => {
    const [x, y] = projeter(fond, 0.1184467, 49.509802);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(fond.W);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(fond.H);
  });
});

describe("communeDeCarte", () => {
  test("rattache un quartier à sa commune", () => {
    expect(communeDeCarte("Le Havre (Sanvic)")).toBe("Le Havre");
    expect(communeDeCarte("Sainte-Adresse")).toBe("Sainte-Adresse");
  });
});

describe("communesAvecChantier", () => {
  test("toutes les communes des références existent sur le fond de carte", () => {
    const noms = new Set(fond.paths.map(([nom]) => nom));
    for (const c of chantiers) expect(noms.has(communeDeCarte(c.commune))).toBe(true);
  });

  test("ne retient que les communes qui ont un chantier", () => {
    const set = communesAvecChantier(chantiers);
    expect(set.has("Le Havre")).toBe(true);
    expect(set.has("Étretat")).toBe(false);
  });
});

describe("pointsPublics", () => {
  const [premier] = chantiers;

  test("adresses masquées : commune seule et position arrondie à 3 décimales", () => {
    const [p] = pointsPublics(fond, [premier], false);
    expect(p.lieu).toBe(premier.commune);
    expect(p.lieu).not.toContain(premier.adresse);
    expect(p.lat).toBe(Math.round(premier.lat * 1000) / 1000);
    expect(p.lon).toBe(Math.round(premier.lon * 1000) / 1000);
  });

  test("adresses affichées : adresse et commune, position exacte", () => {
    const [p] = pointsPublics(fond, [premier], true);
    expect(p.lieu).toBe(`${premier.adresse} — ${premier.commune}`);
    expect(p.lat).toBe(premier.lat);
  });

  test("chaque point porte ses coordonnées sur la carte", () => {
    const [p] = pointsPublics(fond, [premier], false);
    expect([p.x, p.y]).toEqual(projeter(fond, p.lon, p.lat));
  });
});

describe("classeCommune", () => {
  test("met en avant les communes qui ont un chantier, puis Le Havre", () => {
    const hi = new Set(["Sainte-Adresse"]);
    expect(classeCommune("Sainte-Adresse", 0, hi)).toBe("hi");
    expect(classeCommune("Le Havre", 0, new Set())).toBe("ville");
  });

  test("alterne quatre teintes pour les autres communes", () => {
    const teintes = new Set(fond.paths.map(([nom], i) => classeCommune(nom, i, new Set())));
    expect([...teintes].filter((t) => t.startsWith("t")).sort()).toEqual(["t0", "t1", "t2", "t3"]);
  });
});

describe("vueEnsemble", () => {
  test("cadre tous les points, avec une largeur minimale", () => {
    const points = pointsPublics(fond, chantiers, false);
    const v = vueEnsemble(points, 1.5);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(v.x);
      expect(p.x).toBeLessThanOrEqual(v.x + v.w);
    }
    expect(v.w).toBeGreaterThanOrEqual(300);
  });
});
