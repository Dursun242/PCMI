/**
 * Repères chiffrés des communes périphériques, relevés le 28 octobre 2026 :
 * population légale et superficie (INSEE et IGN, via geo.api.gouv.fr),
 * distance à vol d'oiseau entre le centre de la commune et celui de sa
 * ville-centre, indices de cavités par type (base BRGM) et arrêtés de
 * catastrophe naturelle (base GASPAR), via l'API Géorisques.
 *
 * Fichier de données : à régénérer d'un bloc plutôt qu'à retoucher à la main.
 */
import type { Reperes } from "../normandie";

export const REPERES: Record<string, Reperes> = {
  // Thue et Mue
  "14098": {
    insee: "14098",
    population: 6182,
    superficieKm2: 37.1,
    distancePoleKm: 12.2,
    cavites: { total: 1, carrieres: 0, naturelles: 1, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 12, depuis: 1986, inondations: 9, dernier: "juillet 2022", dernierRisque: "sécheresse" },
  },
  // Bretteville-sur-Odon
  "14101": {
    insee: "14101",
    population: 4494,
    superficieKm2: 6.5,
    distancePoleKm: 3.8,
    cavites: { total: 8, carrieres: 8, naturelles: 0, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 9, depuis: 1986, inondations: 7, dernier: "juillet 2018", dernierRisque: "inondations et coulées de boue" },
  },
  // Épron
  "14242": {
    insee: "14242",
    population: 2093,
    superficieKm2: 1.6,
    distancePoleKm: 3.9,
    cavites: { total: 0, carrieres: 0, naturelles: 0, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 5, depuis: 1985, inondations: 3, dernier: "décembre 1999", dernierRisque: "inondations et coulées de boue" },
  },
  // Fleury-sur-Orne
  "14271": {
    insee: "14271",
    population: 5941,
    superficieKm2: 6.8,
    distancePoleKm: 4.1,
    cavites: { total: 18, carrieres: 18, naturelles: 0, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 10, depuis: 1986, inondations: 8, dernier: "juillet 2013", dernierRisque: "inondations et coulées de boue" },
  },
  // Ifs
  "14341": {
    insee: "14341",
    population: 11937,
    superficieKm2: 9,
    distancePoleKm: 5.1,
    cavites: { total: 3, carrieres: 1, naturelles: 0, ouvrages: 2, indeterminees: 0 },
    catnat: { total: 8, depuis: 1986, inondations: 6, dernier: "juillet 2013", dernierRisque: "inondations et coulées de boue" },
  },
  // Mondeville
  "14437": {
    insee: "14437",
    population: 10331,
    superficieKm2: 9.1,
    distancePoleKm: 4.8,
    cavites: { total: 6, carrieres: 6, naturelles: 0, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 12, depuis: 1984, inondations: 9, dernier: "juillet 2013", dernierRisque: "inondations et coulées de boue" },
  },
  // Rots
  "14543": {
    insee: "14543",
    population: 2544,
    superficieKm2: 23.4,
    distancePoleKm: 9.3,
    cavites: { total: 2, carrieres: 2, naturelles: 0, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 14, depuis: 1986, inondations: 12, dernier: "mars 2001", dernierRisque: "inondations et coulées de boue" },
  },
  // Verson
  "14738": {
    insee: "14738",
    population: 4059,
    superficieKm2: 10.4,
    distancePoleKm: 7.3,
    cavites: { total: 1, carrieres: 0, naturelles: 1, ouvrages: 0, indeterminees: 0 },
    catnat: { total: 6, depuis: 1986, inondations: 3, dernier: "décembre 1999", dernierRisque: "inondations et coulées de boue" },
  },
  // Arques-la-Bataille
  "76026": {
    insee: "76026",
    population: 2412,
    superficieKm2: 14.8,
    distancePoleKm: 6.8,
    cavites: { total: 160, carrieres: 37, naturelles: 2, ouvrages: 37, indeterminees: 84 },
    catnat: { total: 9, depuis: 1993, inondations: 5, dernier: "janvier 2025", dernierRisque: "inondations et coulées de boue" },
  },
  // Bois-Guillaume
  "76108": {
    insee: "76108",
    population: 14539,
    superficieKm2: 8.9,
    distancePoleKm: 4.1,
    cavites: { total: 142, carrieres: 50, naturelles: 19, ouvrages: 22, indeterminees: 51 },
    catnat: { total: 10, depuis: 1987, inondations: 8, dernier: "juin 2007", dernierRisque: "inondations et coulées de boue" },
  },
  // Boos
  "76116": {
    insee: "76116",
    population: 3975,
    superficieKm2: 14.1,
    distancePoleKm: 10.9,
    cavites: { total: 159, carrieres: 42, naturelles: 33, ouvrages: 12, indeterminees: 72 },
    catnat: { total: 7, depuis: 1993, inondations: 5, dernier: "juin 2025", dernierRisque: "inondations et coulées de boue" },
  },
  // Hautot-sur-Mer
  "76349": {
    insee: "76349",
    population: 1870,
    superficieKm2: 9.5,
    distancePoleKm: 3.6,
    cavites: { total: 78, carrieres: 0, naturelles: 2, ouvrages: 2, indeterminees: 74 },
    catnat: { total: 22, depuis: 1984, inondations: 13, dernier: "janvier 2026", dernierRisque: "chocs mécaniques des vagues" },
  },
  // Houppeville
  "76367": {
    insee: "76367",
    population: 2814,
    superficieKm2: 20.9,
    distancePoleKm: 6.9,
    cavites: { total: 97, carrieres: 15, naturelles: 18, ouvrages: 16, indeterminees: 48 },
    catnat: { total: 6, depuis: 1987, inondations: 4, dernier: "décembre 1999", dernierRisque: "inondations et coulées de boue" },
  },
  // Isneauville
  "76377": {
    insee: "76377",
    population: 3716,
    superficieKm2: 8.1,
    distancePoleKm: 8,
    cavites: { total: 191, carrieres: 34, naturelles: 38, ouvrages: 10, indeterminees: 109 },
    catnat: { total: 7, depuis: 1984, inondations: 4, dernier: "décembre 1999", dernierRisque: "mouvements de terrain" },
  },
  // Martin-Église
  "76414": {
    insee: "76414",
    population: 1589,
    superficieKm2: 9.6,
    distancePoleKm: 3.3,
    cavites: { total: 20, carrieres: 12, naturelles: 0, ouvrages: 3, indeterminees: 5 },
    catnat: { total: 8, depuis: 1993, inondations: 6, dernier: "juin 2023", dernierRisque: "inondations et coulées de boue" },
  },
  // Le Mesnil-Esnard
  "76429": {
    insee: "76429",
    population: 8177,
    superficieKm2: 5.2,
    distancePoleKm: 5.1,
    cavites: { total: 65, carrieres: 26, naturelles: 8, ouvrages: 7, indeterminees: 24 },
    catnat: { total: 5, depuis: 1993, inondations: 3, dernier: "juillet 2007", dernierRisque: "inondations et coulées de boue" },
  },
  // Franqueville-Saint-Pierre
  "76475": {
    insee: "76475",
    population: 6171,
    superficieKm2: 8.6,
    distancePoleKm: 8,
    cavites: { total: 99, carrieres: 37, naturelles: 7, ouvrages: 5, indeterminees: 50 },
    catnat: { total: 7, depuis: 1985, inondations: 5, dernier: "juillet 2007", dernierRisque: "inondations et coulées de boue" },
  },
  // Offranville
  "76482": {
    insee: "76482",
    population: 3242,
    superficieKm2: 17.3,
    distancePoleKm: 6.5,
    cavites: { total: 21, carrieres: 1, naturelles: 5, ouvrages: 1, indeterminees: 14 },
    catnat: { total: 15, depuis: 1993, inondations: 11, dernier: "mai 2014", dernierRisque: "inondations et coulées de boue" },
  },
  // Quincampoix
  "76517": {
    insee: "76517",
    population: 3103,
    superficieKm2: 20.6,
    distancePoleKm: 10.3,
    cavites: { total: 2, carrieres: 1, naturelles: 0, ouvrages: 0, indeterminees: 1 },
    catnat: { total: 9, depuis: 1987, inondations: 6, dernier: "janvier 2022", dernierRisque: "sécheresse" },
  },
  // Rouxmesnil-Bouteilles
  "76545": {
    insee: "76545",
    population: 1798,
    superficieKm2: 5.6,
    distancePoleKm: 2.7,
    cavites: { total: 43, carrieres: 8, naturelles: 2, ouvrages: 22, indeterminees: 11 },
    catnat: { total: 7, depuis: 1993, inondations: 5, dernier: "juin 2005", dernierRisque: "inondations et coulées de boue" },
  },
  // Saint-Aubin-sur-Scie
  "76565": {
    insee: "76565",
    population: 1219,
    superficieKm2: 7.8,
    distancePoleKm: 3.8,
    cavites: { total: 85, carrieres: 1, naturelles: 2, ouvrages: 4, indeterminees: 78 },
    catnat: { total: 10, depuis: 1983, inondations: 8, dernier: "avril 2018", dernierRisque: "inondations et coulées de boue" },
  },
  // Saint-Jacques-sur-Darnétal
  "76591": {
    insee: "76591",
    population: 3117,
    superficieKm2: 16.7,
    distancePoleKm: 8.4,
    cavites: { total: 239, carrieres: 21, naturelles: 8, ouvrages: 27, indeterminees: 183 },
    catnat: { total: 8, depuis: 1990, inondations: 6, dernier: "janvier 2018", dernierRisque: "inondations et coulées de boue" },
  },
};
