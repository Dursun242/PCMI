/**
 * Télécharge les photos listées dans src/config/photos.ts vers public/photos/.
 * Usage : npm run photos
 * Ne retélécharge pas un fichier déjà présent.
 *
 * Ce script tourne en `prebuild` sur Vercel : toute erreur réseau (Unsplash
 * indisponible, bloqué, DNS, timeout…) est capturée pour ne jamais faire
 * échouer le build. Des placeholders sont déjà commités dans public/photos/,
 * ce script ne fait donc que les remplacer si on le lance à la main.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, "public/photos");
await mkdir(dir, { recursive: true });

// Lecture du manifest sans compiler le TS : on extrait file + source par regex.
const ts = await readFile(resolve(root, "src/config/photos.ts"), "utf8");
const idPattern = /file:\s*"([^"]+)"[\s\S]*?source:\s*u\("([^"]+)"\)/g;
const base = 'https://images.unsplash.com/';
const query = "?fm=jpg&q=82&w=2000&auto=format&fit=crop";

let m;
let n = 0;
while ((m = idPattern.exec(ts))) {
  const [, file, id] = m;
  const target = resolve(dir, file);
  try {
    await access(target);
    console.log(`= ${file} (déjà présent)`);
    continue;
  } catch {}
  const url = base + id + query;
  process.stdout.write(`↓ ${file} … `);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`échec (${res.status})`);
      continue;
    }
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log("ok");
    n++;
  } catch (err) {
    // Réseau indisponible, DNS, timeout… on garde le placeholder existant
    // (ou l'absence de fichier, gérée par Gallery) plutôt que de casser le build.
    console.log(`échec (${err.code ?? err.message})`);
  }
}
console.log(`${n} photo(s) téléchargée(s) dans public/photos/`);
