import { describe, expect, test } from "vitest";
import { ETAT_INITIAL, suivreDefilement, type EtatDefilement } from "./defilement";

const BAS_DE_PAGE = 5000;

/** Rejoue une suite de positions de défilement à partir de l'état initial. */
function rejouer(positions: number[], depart: EtatDefilement = ETAT_INITIAL): EtatDefilement {
  return positions.reduce((etat, y) => suivreDefilement(etat, y, BAS_DE_PAGE), depart);
}

describe("suivreDefilement", () => {
  test("reste inactif en haut de page", () => {
    expect(rejouer([0, 40, 90])).toEqual({ sens: "haut", repere: 90, actif: false });
  });

  test("passe en descente après 16 px sous le point le plus haut", () => {
    const arret: EtatDefilement = { sens: "haut", repere: 300, actif: true };
    expect(rejouer([310], arret).sens).toBe("haut");
    expect(rejouer([317], arret)).toEqual({ sens: "bas", repere: 317, actif: true });
  });

  test("ignore une petite remontée, réaffiche après 48 px", () => {
    const enDescente = rejouer([300, 400, 800]);
    expect(enDescente.sens).toBe("bas");
    expect(rejouer([770], enDescente).sens).toBe("bas");
    expect(rejouer([751], enDescente).sens).toBe("haut");
  });

  test("le repère suit le point extrême dans le sens courant", () => {
    expect(rejouer([300, 400, 900, 880]).repere).toBe(900);
  });

  test("le rebond de fin de page ne change rien", () => {
    const etat = rejouer([300, 400, 800]);
    expect(suivreDefilement(etat, BAS_DE_PAGE - 2, BAS_DE_PAGE)).toBe(etat);
  });

  test("revenir en haut de page désactive tout", () => {
    expect(rejouer([300, 900, 50])).toEqual({ sens: "haut", repere: 50, actif: false });
  });

  test("ne modifie pas l'état reçu", () => {
    const etat = { ...ETAT_INITIAL };
    suivreDefilement(etat, 600, BAS_DE_PAGE);
    expect(etat).toEqual(ETAT_INITIAL);
  });
});
