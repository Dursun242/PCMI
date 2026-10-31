import { describe, expect, it } from "vitest";
import { validerCommande } from "./commande";
import { emailConfirmationClient, emailIbanEnAttente, emailNouvelleCommande, emailReprise } from "./emailsCommande";

const r = validerCommande({
  panier: { formule: "complet", options: {} },
  echeances: 4,
  coordonnees: {
    prenom: "Marie",
    nom: "Martin",
    email: "marie@example.fr",
    telephone: "0612345678",
    adresse: "12 rue des Lilas",
    codePostal: "76600",
    ville: "Le Havre",
    terrainAdresse: "Chemin <du> Bois",
    terrainCodePostal: "76290",
    terrainCommune: "Montivilliers",
    surface: "120",
  },
});
if (!r.ok) throw new Error(r.erreur);
const commande = r.commande;
const devis = { numero: "D-2026-012", url: "https://portal.qonto.com/quotes/1" };

describe("e-mails de la commande", () => {
  it("la confirmation donne le devis, les CGV et le délai de rétractation, en échappant le texte saisi", () => {
    const e = emailConfirmationClient(commande, devis);
    expect(e.html).toContain(devis.url);
    expect(e.html).toContain("/cgv");
    expect(e.html).toMatch(/14 jours/);
    expect(e.html).toContain("Chemin &lt;du&gt; Bois");
    expect(e.html).not.toContain("Chemin <du> Bois");
  });

  it("annonce le devis joint en PDF quand il l'est", () => {
    expect(emailConfirmationClient(commande, devis, true).html).toMatch(/joint à cet e-mail en PDF/);
    expect(emailConfirmationClient(commande, devis, false).html).not.toMatch(/joint/);
  });

  it("la fiche interne contient la facturation à lancer et la preuve de signature", () => {
    const e = emailNouvelleCommande(
      commande,
      devis,
      { iban: "•••• 0189", reference: "RUM-1" },
      { instant: "2026-11-01T10:00:00Z", ip: "1.2.3.4", navigateur: "Safari", executionAnticipee: false },
      "2026-11-01",
    );
    expect(e.subject).toMatch(/Commande signée — Marie Martin — Montivilliers/);
    expect(e.html).toMatch(/Facture unique de/);
    expect(e.html).toMatch(/4 prélèvements mensuels de/);
    expect(e.html).toMatch(/16\/11\/2026/);
    expect(e.html).toContain("RUM-1");
    expect(e.html).toContain("1.2.3.4");
  });

  it("l'e-mail de reprise ramène à l'étape IBAN, sans rien prélever", () => {
    const e = emailReprise(commande, "https://site.test/commander/reprendre?jeton=abc");
    expect(e.subject).toMatch(/il ne manque que votre IBAN/);
    expect(e.html).toContain('href="https://site.test/commander/reprendre?jeton=abc"');
    expect(e.html).toMatch(/7 jours/);
    expect(e.html).toMatch(/Rien n'est prélevé/);
  });

  it("l'alerte interne donne de quoi rappeler le client", () => {
    const e = emailIbanEnAttente(commande);
    expect(e.subject).toMatch(/Devis accepté, IBAN en attente — Marie Martin/);
    expect(e.html).toContain("0612345678");
    expect(e.html).toContain("Montivilliers");
  });
});
