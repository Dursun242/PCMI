import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ecrireDp, ecrireFacette, jetonValide, lireDp, empreinteJeton, type EntreeDp } from "@/lib/dpPiscineStore";

const secret = "secret-de-test";

describe("registre des DP piscine", () => {
  test("résultat, plans puis Cerfa envoyés coup sur coup : rien n'est écrasé", async () => {
    const id = "11111111-2222-4333-8444-555555555555";
    const base: EntreeDp = {
      id,
      jeton: empreinteJeton("k"),
      jetonChiffre: "x",
      cree: 1,
      maj: 1,
      statut: "en_cours",
      commune: "Le Havre",
      reference: "TO 0572, TO 0571",
      contact: "c",
    };
    await ecrireDp(base, secret);
    await ecrireFacette(id, secret, "resultat", { statut: "bloque", apercus: ["a.jpg"] });
    await ecrireFacette(id, secret, "fichier-dossier", { fichiers: { dossier: "plans.pdf" } });
    await ecrireFacette(id, secret, "fichier-cerfa", { fichiers: { cerfa: "cerfa.pdf" } });
    const e = await lireDp(id, secret);
    expect(e?.statut).toBe("bloque");
    expect(e?.apercus).toEqual(["a.jpg"]);
    expect(e?.fichiers).toEqual({ dossier: "plans.pdf", cerfa: "cerfa.pdf" });
    expect(e?.reference).toBe("TO 0572, TO 0571");
    expect(jetonValide(e as EntreeDp, "k")).toBe(true);
    expect(jetonValide(e as EntreeDp, "autre")).toBe(false);
  });

  test("identifiant mal formé : aucun dossier", async () => {
    expect(await lireDp("../../etc", secret)).toBeNull();
  });
});
