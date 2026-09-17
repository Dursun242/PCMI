/**
 * Étape 4 — Indexation immédiate (IndexNow : Bing, Yandex, Seznam, Naver…).
 * Soumet les URL modifiées depuis le dernier commit. Google n'utilise pas IndexNow
 * mais lit le sitemap.xml, régénéré à chaque build.
 */
import { execSync } from "node:child_process";
import { SITE_URL } from "./lib.mjs";

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.log("INDEXNOW_KEY manquante : pas de soumission IndexNow.");
  process.exit(0);
}
let changed = [];
try {
  changed = execSync("git diff --name-only HEAD~1 HEAD", { encoding: "utf8" }).split("\n").filter(Boolean);
} catch {}
const urls = new Set([`${SITE_URL}/conseils`]);
for (const f of changed) {
  const m = f.match(/^content\/articles\/(.+)\.mdx?$/);
  if (m) urls.add(`${SITE_URL}/conseils/${m[1]}`);
  if (f === "seo/meta-overrides.json") ["/", "/tarifs", "/permis-de-construire-maison", "/devis"].forEach((p) => urls.add(SITE_URL + p));
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE_URL).hostname, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList: [...urls] }),
});
console.log(`IndexNow : ${res.status} pour ${urls.size} URL`);
