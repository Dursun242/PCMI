/**
 * Vérifie public/references-chantiers/chantiers.json (page non liée
 * /references-chantiers.html). Mode d'emploi : docs/references-chantiers.md
 * Usage : npm run check:references
 *
 * Tourne en `prebuild` : une erreur fait échouer le build Vercel, donc la
 * version précédente de la page reste en ligne au lieu d'une page vide.
 */
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(import.meta.dirname, "../public/references-chantiers");
// Emprise du fond de carte (MAP.box dans la page) : [lonMin, lonMax, latMin, latMax].
const BOX = [-0.06, 0.62, 49.36, 49.8];

const erreurs = [];
let chantiers;
try {
  chantiers = JSON.parse(await readFile(resolve(dir, "chantiers.json"), "utf8"));
} catch (e) {
  console.error(`\n✗ chantiers.json illisible : ${e.message}`);
  console.error("  (souvent une virgule oubliée ou en trop, ou un guillemet manquant)\n");
  process.exit(1);
}

if (!Array.isArray(chantiers) || chantiers.length === 0) {
  erreurs.push("le fichier doit contenir une liste [ … ] d'au moins une référence");
} else {
  for (const [i, c] of chantiers.entries()) {
    const nom = `référence n°${i + 1}${c?.titre ? ` (« ${c.titre} »)` : ""}`;
    for (const champ of ["titre", "adresse", "commune", "gps", "photo"]) {
      if (typeof c?.[champ] !== "string" || !c[champ].trim()) erreurs.push(`${nom} : champ "${champ}" manquant ou vide`);
    }
    if (typeof c?.gps === "string") {
      const [lat, lon] = c.gps.split(",").map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        erreurs.push(`${nom} : "gps" doit ressembler à "49.5098, 0.1184" (latitude, longitude)`);
      } else if (lon < BOX[0] || lon > BOX[1] || lat < BOX[2] || lat > BOX[3]) {
        erreurs.push(`${nom} : les coordonnées ${c.gps} sont en dehors de la carte (pointe de Caux)`);
      }
    }
    if (typeof c?.photo === "string" && c.photo.trim()) {
      try {
        await access(resolve(dir, c.photo));
      } catch {
        erreurs.push(`${nom} : photo "${c.photo}" introuvable dans public/references-chantiers/`);
      }
    }
  }
}

if (erreurs.length) {
  console.error(`\n✗ chantiers.json : ${erreurs.length} erreur(s)`);
  for (const e of erreurs) console.error(`  - ${e}`);
  console.error("");
  process.exit(1);
}
console.log(`✓ chantiers.json : ${chantiers.length} références valides`);
