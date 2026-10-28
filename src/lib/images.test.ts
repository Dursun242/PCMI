import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { getArticles } from "./articles";
import { chantiers, vitrine } from "@/config/references";

/**
 * Google Images lit le texte alternatif, le nom du fichier et le texte qui
 * entoure l'image. Ces tests empêchent de remettre en ligne une image sans
 * description ou nommée par l'appareil qui l'a produite.
 */

/** Noms donnés par un téléphone, une capture ou un générateur : rien pour le référencement. */
const NOM_SANS_SENS = /(whatsapp|capture|screenshot|img[-_]?\d|dsc[-_]?\d|gemini|chantier-\d+|^\d{10,}-)/i;

const fichier = (path: string) => path.split("/").pop() as string;
const existe = (path: string) => existsSync(join(process.cwd(), "public", path));

describe("images des articles", () => {
  const articles = getArticles();

  test("chaque image d'en-tête a un texte alternatif descriptif", () => {
    for (const a of articles.filter((x) => x.image)) {
      expect(a.imageAlt, `${a.slug} : imageAlt manquant`).toBeTruthy();
      expect(a.imageAlt!.length, `${a.slug} : imageAlt trop court`).toBeGreaterThanOrEqual(40);
    }
  });

  test("chaque image a un nom de fichier qui décrit son sujet, et existe", () => {
    for (const a of articles.filter((x) => x.image)) {
      expect(fichier(a.image!), `${a.slug} : nom de fichier`).not.toMatch(NOM_SANS_SENS);
      expect(existe(a.image!), `${a.slug} : ${a.image} introuvable`).toBe(true);
    }
  });
});

describe("photos des références chantiers", () => {
  test("chaque photo porte un nom descriptif et existe", () => {
    for (const p of new Set([...chantiers.map((c) => c.photo), ...vitrine])) {
      expect(fichier(p), p).not.toMatch(NOM_SANS_SENS);
      expect(existe(p), `${p} introuvable`).toBe(true);
    }
  });
});
