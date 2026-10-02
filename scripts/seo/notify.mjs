/**
 * Étape 5 — Notification.
 * Envoie par e-mail (Resend) le résumé du cycle : l'article publié, pourquoi ce
 * sujet a été choisi, et les prochaines opportunités repérées dans Search Console.
 *
 * Jamais d'exception : un e-mail manqué ne doit pas faire échouer le cycle.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { Resend } from "resend";
import { readJson, ROOT, RUN_FILE, SITE_URL } from "./lib.mjs";

const run = readJson(RUN_FILE, null);
if (!run?.slug) {
  console.log("Aucun article écrit pendant ce cycle : pas d'e-mail.");
  process.exit(0);
}
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY manquante : pas d'e-mail.");
  process.exit(0);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const FONT = "font-family:Lato,Arial,sans-serif";

const article = matter(readFileSync(resolve(ROOT, `content/articles/${run.slug}.mdx`), "utf8")).data;
const url = `${SITE_URL}/conseils/${run.slug}`;
const report = readJson("seo/report.json", { opportunities: [] });

function why() {
  const o = run.opportunity;
  if (run.kind === "refresh") return "Article existant réécrit et étoffé.";
  if (!o) return `Sujet imposé au lancement manuel : « ${esc(run.query)} ».`;
  if (o.source === "gsc") {
    return `Requête « ${esc(o.query)} » relevée dans Search Console : ${o.impressions} impressions et ${o.clicks} clics sur 28 jours, position moyenne ${o.position}.`;
  }
  return `Requête « ${esc(o.query)} » tirée de la liste de mots-clés de départ (Search Console ${report.mode === "seed" ? "pas encore branchée ou sans données" : "sans meilleure opportunité"}).`;
}

const next = (report.opportunities ?? [])
  .filter((o) => o.query !== run.query)
  .slice(0, 5)
  .map((o) => `<li>${esc(o.query)}${o.source === "gsc" ? ` <span style="color:#939b96">(${o.impressions} impr., pos. ${o.position})</span>` : ""}</li>`)
  .join("");

const image = article.image ? `<p><img src="${esc(SITE_URL + article.image)}" alt="${esc(article.imageAlt ?? "")}" width="560" style="max-width:100%;height:auto;border:1px solid #e4e0d7"></p>` : "";

const html = `<div style="${FONT};font-size:16px;line-height:1.6;color:#1b1f1d;max-width:560px">
<p>${run.kind === "refresh" ? "Un article vient d'être mis à jour" : "Un nouvel article vient d'être publié"} sur le site.</p>
<h2 style="font-size:20px;margin:18px 0 6px"><a href="${esc(url)}" style="color:#1b1f1d">${esc(article.title)}</a></h2>
<p style="color:#5a645e;margin-top:0">${esc(article.description)}</p>
${image}
<h3 style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a9884f;margin:22px 0 6px">Pourquoi ce sujet</h3>
<p>${why()}</p>
${next ? `<h3 style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a9884f;margin:22px 0 6px">Prochaines opportunités</h3><ul style="padding-left:18px">${next}</ul>` : ""}
<p style="color:#939b96;font-size:13px">La mise en ligne prend quelques minutes, le temps que Vercel redéploie le site.</p>
</div>`;

try {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM ?? "Permis by ID Maîtrise <contact@id-maitrise.com>",
    to: process.env.MAIL_TO ?? "contact@id-maitrise.com",
    subject: `${run.kind === "refresh" ? "Article mis à jour" : "Nouvel article"} : ${article.title}`,
    html,
  });
  if (error) throw new Error(error.message);
  console.log("E-mail de notification envoyé.");
} catch (e) {
  console.error(`E-mail non envoyé : ${e.message}`);
}
