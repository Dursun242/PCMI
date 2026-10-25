import { describe, expect, it } from "vitest";
import { cibleLien, domaine, libelleTemps, niveauxNouveaux, pourcentLu, resumer } from "./mesure";

describe("niveauxNouveaux", () => {
  it("donne les paliers franchis qui n'ont pas encore été envoyés", () => {
    expect(niveauxNouveaux(10, new Set())).toEqual([]);
    expect(niveauxNouveaux(60, new Set())).toEqual([25, 50]);
    expect(niveauxNouveaux(100, new Set([25, 50]))).toEqual([75, 100]);
  });
});

describe("pourcentLu", () => {
  it("compte le bas de l'écran, et 100 en bas de page", () => {
    expect(pourcentLu(0, 800, 3200)).toBe(25);
    expect(pourcentLu(800, 800, 3200)).toBe(50);
    expect(pourcentLu(2399, 800, 3200)).toBe(100);
  });

  it("une page plus courte que l'écran est lue en entier", () => {
    expect(pourcentLu(0, 800, 700)).toBe(100);
  });
});

describe("libelleTemps", () => {
  it("reprend les tranches du compteur Express", () => {
    expect(libelleTemps(5_000)).toBe("Moins de 10 s");
    expect(libelleTemps(45_000)).toBe("30 s à 1 min");
    expect(libelleTemps(600_000)).toBe("Plus de 3 min");
  });
});

describe("resumer", () => {
  it("met sur une ligne et coupe les textes trop longs", () => {
    expect(resumer("  Combien\n  de temps ?  ")).toBe("Combien de temps ?");
    expect(resumer("a".repeat(80), 10)).toBe(`${"a".repeat(9)}…`);
    expect(resumer(null)).toBe("");
  });
});

describe("cibleLien", () => {
  const site = "https://permis-maison-individuelle.fr";
  it("reconnaît les contacts, le devis et les autres sites", () => {
    expect(cibleLien("tel:+33679116085", site)).toBe("appel");
    expect(cibleLien("mailto:contact@id-maitrise.com", site)).toBe("e-mail");
    expect(cibleLien("https://wa.me/33679116085?text=Bonjour", site)).toBe("whatsapp");
    expect(cibleLien("/devis?formule=complet", site)).toBe("devis");
    expect(cibleLien("/permis-express#devis", site)).toBe("devis");
    expect(cibleLien("https://www.id-maitrise.com", site)).toBe("externe");
    expect(cibleLien("/tarifs", site)).toBe("interne");
    expect(cibleLien("#faq", site)).toBe("ancre");
  });
});

describe("domaine", () => {
  it("garde le nom de domaine, sans www", () => {
    expect(domaine("https://www.instagram.com/idmaitrise")).toBe("instagram.com");
    expect(domaine("pas une adresse")).toBeNull();
  });
});
