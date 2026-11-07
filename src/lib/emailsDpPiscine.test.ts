import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { emailClientVerification } = await import("./emailsDpPiscine");

const c = { prenom: "Jean", nom: "DURAND", email: "jean@example.fr", telephone: "" };
const e = { reference: "TO 0572", commune: "Le Havre" };

describe("e-mail au client d'un dossier bloqué (07/11/2026)", () => {
  it("liste ce que le client peut corriger", () => {
    const m = emailClientVerification(c, e, ["Bassin à 0,80 m de la limite la plus proche"], "https://exemple.fr/suivi");
    expect(m.subject).toContain("un point à corriger");
    expect(m.html).toContain("0,80 m de la limite");
  });

  it("sans rien à corriger côté client : « nous la vérifions », pas de point à corriger", () => {
    const m = emailClientVerification(c, e, [], "https://exemple.fr/suivi");
    expect(m.subject).toContain("nous la vérifions");
    expect(m.html).toContain("Vous n'avez rien à faire");
    expect(m.html).not.toContain("Corriger mon dossier");
  });
});
