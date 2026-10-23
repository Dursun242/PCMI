import { describe, expect, it } from "vitest";
import {
  cheminEvenement,
  compter,
  contacts,
  jourParis,
  joursAvant,
  lireChemin,
  parJour,
  tauxContact,
  type Evenement,
} from "./suivi";

const e = (jour: string, type: Evenement["type"], source: Evenement["source"] = "ads"): Evenement => ({ jour, type, source });

describe("chemins", () => {
  it("relit le chemin qu'il a écrit", () => {
    const ev = e("2026-10-23", "demande-urgente", "direct");
    expect(lireChemin(cheminEvenement(ev, "abc"))).toEqual(ev);
  });

  it("ignore les chemins étrangers ou mal formés", () => {
    expect(lireChemin("envois/plan.pdf")).toBeNull();
    expect(lireChemin("suivi/express/2026-10-23/inconnu/ads/x.txt")).toBeNull();
    expect(lireChemin("suivi/express/23-10-2026/vue/ads/x.txt")).toBeNull();
    expect(lireChemin("suivi/express/2026-10-23/vue/autre/x.txt")).toBeNull();
  });
});

describe("compter", () => {
  const evenements = [
    e("2026-10-20", "vue"),
    e("2026-10-22", "vue", "direct"),
    e("2026-10-23", "vue"),
    e("2026-10-23", "formulaire"),
    e("2026-10-23", "demande"),
    e("2026-10-23", "demande-urgente"),
    e("2026-10-23", "appel"),
    e("2026-10-23", "whatsapp"),
  ];

  it("totalise chaque type et distingue les visites venues des annonces", () => {
    const c = compter(evenements);
    expect(c).toMatchObject({ visites: 3, visitesAds: 2, formulaires: 1, demandes: 2, demandesUrgentes: 1, appels: 1, whatsapp: 1 });
  });

  it("ne compte qu'à partir du jour demandé", () => {
    expect(compter(evenements, "2026-10-22").visites).toBe(2);
  });

  it("calcule les contacts et le taux de contact", () => {
    const c = compter(evenements);
    expect(contacts(c)).toBe(4);
    expect(tauxContact(c)).toBe(133.3);
    expect(tauxContact(compter([]))).toBeNull();
  });

  it("répartit par jour, jours vides compris", () => {
    const jours = parJour(evenements, "2026-10-23", 4);
    expect(jours.map((j) => j.jour)).toEqual(["2026-10-23", "2026-10-22", "2026-10-21", "2026-10-20"]);
    expect(jours[2].compteurs.visites).toBe(0);
    expect(jours[0].compteurs.demandes).toBe(2);
  });
});

describe("dates", () => {
  it("recule d'un mois proprement", () => {
    expect(joursAvant("2026-11-01", 1)).toBe("2026-10-31");
  });

  it("date à l'heure de Paris", () => {
    // 23 h 30 UTC le 23 octobre = 1 h 30 à Paris le 24 (heure d'été).
    expect(jourParis(new Date("2026-10-23T23:30:00Z"))).toBe("2026-10-24");
  });
});
