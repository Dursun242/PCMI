import { describe, expect, it } from "vitest";
import { signerJeton, verifierJeton, type DonneesCommande } from "./jetonCommande";

const SECRET = "secret-de-test";
const JOUR = 24 * 60 * 60 * 1000;
const maintenant = Date.UTC(2026, 10, 1);

const donnees: DonneesCommande = {
  clientId: "c-1",
  devisId: "d-1",
  mandatId: "m-1",
  selection: { formule: "complet", options: { "rendu-3d": 1 } },
  echeances: 4,
  coordonnees: { prenom: "Marie", nom: "Martin", email: "marie@example.fr", surface: "120" },
};

describe("jeton de commande", () => {
  it("restitue la commande signée", () => {
    const jeton = signerJeton(donnees, SECRET, maintenant);
    expect(verifierJeton(jeton, SECRET, maintenant + JOUR)).toEqual(donnees);
  });

  it("transporte la preuve d'acceptation du devis", () => {
    const acceptee = { ...donnees, acceptation: { instant: "2026-11-01T10:00:00Z", ip: "1.2.3.4", navigateur: "Safari", executionAnticipee: true } };
    expect(verifierJeton(signerJeton(acceptee, SECRET, maintenant), SECRET, maintenant)).toEqual(acceptee);
  });

  it("refuse un jeton modifié", () => {
    const [charge, signature] = signerJeton(donnees, SECRET, maintenant).split(".");
    const falsifiee = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(charge, "base64url").toString()), echeances: 10 }),
    ).toString("base64url");
    expect(verifierJeton(`${falsifiee}.${signature}`, SECRET, maintenant)).toBeNull();
  });

  it("refuse un jeton signé avec une autre clé", () => {
    expect(verifierJeton(signerJeton(donnees, "autre", maintenant), SECRET, maintenant)).toBeNull();
  });

  it("refuse un jeton expiré", () => {
    const jeton = signerJeton(donnees, SECRET, maintenant, 7);
    expect(verifierJeton(jeton, SECRET, maintenant + 6 * JOUR)).not.toBeNull();
    expect(verifierJeton(jeton, SECRET, maintenant + 8 * JOUR)).toBeNull();
  });

  it("refuse un jeton illisible ou absent", () => {
    expect(verifierJeton("n'importe quoi", SECRET, maintenant)).toBeNull();
    expect(verifierJeton("", SECRET, maintenant)).toBeNull();
    expect(verifierJeton(undefined, SECRET, maintenant)).toBeNull();
  });

  it("refuse de signer sans clé", () => {
    expect(() => signerJeton(donnees, "", maintenant)).toThrow();
  });
});
