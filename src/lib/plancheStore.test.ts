import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { chiffrer, empreinteDemande, empreinteParcelle } from "./plancheSecret";
import { demandeDejaFaite, ecrirePlanche, type EntreePlanche } from "./plancheStore";

const secret = "un-secret-de-test";
const parcelleA = "76351000OJ0646";
const parcelleB = "76351000OJ0647";

function entree(empreinte: string, email: string): EntreePlanche {
  return {
    id: crypto.randomUUID(),
    empreinte,
    planche: "masse",
    commune: "Le Havre",
    reference: "OJ 0646",
    cree: 0,
    maj: 0,
    statut: "livree",
    contact: chiffrer(JSON.stringify({ prenom: "Marie", nom: "Durand", email }), secret),
  };
}

describe("une planche gratuite par terrain et par personne", () => {
  beforeEach(() => {
    // Sans jeton Vercel Blob, le registre vit en mémoire : on le vide entre deux tests.
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    (globalThis as { __pcmiPlanches?: Map<string, EntreePlanche> }).__pcmiPlanches = new Map();
  });

  it("refuse une deuxième planche à la même personne sur le même terrain", async () => {
    await ecrirePlanche(entree(empreinteDemande(parcelleA, "marie@exemple.fr", secret), "marie@exemple.fr"));

    expect(await demandeDejaFaite(parcelleA, "Marie@Exemple.fr", secret)).toBe(true);
  });

  it("accepte la même personne sur un autre terrain, et une autre personne sur le même terrain", async () => {
    await ecrirePlanche(entree(empreinteDemande(parcelleA, "marie@exemple.fr", secret), "marie@exemple.fr"));

    expect(await demandeDejaFaite(parcelleB, "marie@exemple.fr", secret)).toBe(false);
    expect(await demandeDejaFaite(parcelleA, "paul@exemple.fr", secret)).toBe(false);
  });

  it("garde bloqué l'auteur d'une demande d'avant la règle, et libère la parcelle pour les autres", async () => {
    await ecrirePlanche(entree(empreinteParcelle(parcelleA, secret), "marie@exemple.fr"));

    expect(await demandeDejaFaite(parcelleA, "marie@exemple.fr", secret)).toBe(true);
    expect(await demandeDejaFaite(parcelleA, "paul@exemple.fr", secret)).toBe(false);
  });
});
