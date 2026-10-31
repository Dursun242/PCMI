import { describe, expect, it } from "vitest";
import { formuleDevisImmediat, lienCommandeImmediate, mentionOffreLancement } from "./devisImmediat";

const maison = { plan: "complet", surface: "120", projet: "maison-neuve" };

describe("formuleDevisImmediat", () => {
  it("affiche le prix d'une maison neuve avec formule choisie et surface dans les formules", () => {
    expect(formuleDevisImmediat(maison)).toBe("complet");
    expect(formuleDevisImmediat({ ...maison, plan: "essentiel" })).toBe("essentiel");
    expect(formuleDevisImmediat({ ...maison, surface: 149 })).toBe("complet");
  });

  it("garde le chiffrage humain quand le visiteur demande conseil", () => {
    expect(formuleDevisImmediat({ ...maison, plan: "conseil" })).toBeNull();
  });

  it("garde le chiffrage humain au-delà de 149 m² ou sans surface exploitable", () => {
    expect(formuleDevisImmediat({ ...maison, surface: "150" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: "" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: undefined })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: "0" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: "abc" })).toBeNull();
  });

  it("garde le chiffrage humain pour une extension, une annexe ou un autre projet", () => {
    expect(formuleDevisImmediat({ ...maison, projet: "extension" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, projet: "garage-annexe" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, projet: undefined })).toBeNull();
  });

  it("juge la surface arrondie, comme le lien de commande", () => {
    expect(formuleDevisImmediat({ ...maison, surface: "149.4" })).toBe("complet");
    expect(formuleDevisImmediat({ ...maison, surface: "149.5" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: "149.00000001" })).toBe("complet");
    expect(formuleDevisImmediat({ ...maison, surface: "0.4" })).toBeNull();
    expect(formuleDevisImmediat({ ...maison, surface: " 120 " })).toBe("complet");
  });

  it("refuse une formule inconnue", () => {
    expect(formuleDevisImmediat({ ...maison, plan: "express" })).toBeNull();
  });
});

describe("mentionOffreLancement", () => {
  it("rappelle la date limite quand le prix affiché est un prix d'offre", () => {
    expect(mentionOffreLancement({ regularPriceTTC: 1990 })).toMatch(/au plus tard le \d{1,2} \S+ \d{4}\.$/);
  });

  it("ne dit rien pour un prix habituel", () => {
    expect(mentionOffreLancement({ regularPriceTTC: undefined })).toBeNull();
  });
});

describe("lienCommandeImmediate", () => {
  it("pré-remplit la commande avec la formule et la surface arrondie", () => {
    expect(lienCommandeImmediate("complet", "119.6")).toBe("/commander?formule=complet&surface=120");
  });
});
