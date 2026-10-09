import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { chantiers, vitrine } from "@/config/references";
import { enVitrine } from "./vitrine";

describe("enVitrine", () => {
  test("garde l'ordre de la sélection", () => {
    const choix = [chantiers[2].photo, chantiers[0].photo];
    expect(enVitrine(chantiers, choix).map((c) => c.photo)).toEqual(choix);
  });

  test("ne publie ni adresse ni coordonnées", () => {
    const [c] = enVitrine(chantiers, [chantiers[0].photo]);
    expect(Object.keys(c).sort()).toEqual(["commune", "photo", "titre"]);
  });

  test("refuse une photo qui n'est pas une référence", () => {
    expect(() => enVitrine(chantiers, ["/photos/maison-le-touquet.jpg"])).toThrow(/maison-le-touquet/);
  });
});

describe("sélection de l'accueil", () => {
  test("chaque photo choisie est une référence dont le fichier existe", () => {
    const choisies = enVitrine(chantiers, vitrine);
    expect(choisies.length).toBeGreaterThanOrEqual(5);
    for (const c of choisies) expect(existsSync(join(process.cwd(), "public", c.photo))).toBe(true);
  });

  test("aucune photo en double", () => {
    expect(new Set(vitrine).size).toBe(vitrine.length);
  });
});
