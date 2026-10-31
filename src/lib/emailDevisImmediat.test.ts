import { describe, expect, it } from "vitest";
import { lancement, plans } from "@/config/site";
import { formatEuro } from "./format";
import { devisImmediatEmailHtml, devisImmediatEmailSujet } from "./emailDevisImmediat";

const complet = plans.find((p) => p.id === "complet")!;

describe("devisImmediatEmailHtml", () => {
  it("reprend le prix affiché à l'écran et le lien de commande pré-rempli", () => {
    const html = devisImmediatEmailHtml(complet, "119.6");
    expect(html).toContain(formatEuro(complet.priceTTC));
    expect(html).toContain("/commander?formule=complet&amp;surface=120");
    expect(html).toContain(complet.delayWorkingDays);
  });

  it("rappelle la date limite quand le prix est celui de l'offre en cours", () => {
    const html = devisImmediatEmailHtml(complet, "120");
    // Le nom de l'offre est échappé dans l'e-mail (apostrophe) : on vérifie la date limite.
    if (lancement.actif) expect(html).toMatch(/au plus tard le \d{1,2} \S+ \d{4}\./);
    else expect(html).not.toContain("au plus tard le");
  });

  it("ne mentionne aucune offre pour un prix habituel", () => {
    const html = devisImmediatEmailHtml({ ...complet, regularPriceTTC: undefined }, "120");
    expect(html).not.toContain("au plus tard le");
  });
});

describe("devisImmediatEmailSujet", () => {
  it("annonce la formule et le prix dans l'objet", () => {
    expect(devisImmediatEmailSujet(complet)).toContain(`formule Complet, ${formatEuro(complet.priceTTC)} TTC`);
  });
});
