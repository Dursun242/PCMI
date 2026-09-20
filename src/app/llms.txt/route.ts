import { site, plans, options, exePlans, exePacks, metiers, thermique } from "@/config/site";
import { staticPages } from "@/config/pages";
import { getArticles } from "@/lib/articles";
import { SURFACE_ARCHITECTE, SURFACE_MAX } from "@/lib/formulaFinder";

/**
 * /llms.txt — format llmstxt.org.
 *
 * Résumé du service destiné aux assistants qui lisent le site sans exécuter
 * de JavaScript. Généré à partir des mêmes sources que le sitemap
 * (src/config/pages.ts) et que les prix (src/config/site.ts) : il ne peut pas
 * se désynchroniser du site.
 */
export const dynamic = "force-static";

function euros(n: number) {
  return `${n.toLocaleString("fr-FR")} € TTC`;
}

export function GET() {
  const articles = getArticles();
  const pages = staticPages.filter((p) => p.path !== "/confidentialite");

  const body = `# ${site.name}

> ${site.tagline}

${site.name} est la marque de la ${site.legal.company}, bureau d'études en ingénierie de la construction qui allie calcul de structure et conception architecturale, établi au ${site.address.street}, ${site.address.zip} ${site.address.city}, fondé par ${site.author}, maître d'œuvre.
Métiers réunis dans le bureau d'études : ${metiers.map((m) => m.titre.toLowerCase()).join(", ")}.
Nous concevons et déposons des dossiers de permis de construire de maison individuelle (pièces PCMI 1 à 8), partout en France, à distance.
Le prix est fixe et annoncé avant de commencer ; il ne dépend ni de la surface de la maison ni du coût des travaux.
Les formules à prix fixe s'appliquent jusqu'à ${SURFACE_MAX} m² de surface de plancher ; au-delà, le permis est établi sur devis.
Au-delà de ${SURFACE_ARCHITECTE} m² de surface de plancher, le recours à un architecte est légalement obligatoire (code de l'urbanisme, art. L.431-3) ; le dossier est alors monté avec un architecte partenaire.

## Formules

${plans
  .map((p) => `- **${p.name}** — ${euros(p.priceTTC)}, livré sous ${p.delayWorkingDays}. ${p.promise} ${p.forWho}`)
  .join("\n")}

Au-delà de ${SURFACE_MAX} m² de surface de plancher : sur devis.

## Options

${options.map((o) => `- ${o.name} — ${euros(o.priceTTC)}. ${o.note}`).join("\n")}

## Plans d'exécution (après le permis)
Plans EXE dessinés par le pôle conception, dimensionnement des ouvrages porteurs par le bureau d'études structure d'ID Maîtrise. Prix « à partir de », TTC, devis fixe lot par lot sous 4 h ouvrées.
${exePacks.map((p) => `- **${p.name}** — à partir de ${euros(p.fromPriceTTC)}, livré sous ${p.delayWorkingDays}. ${p.promise}`).join("\n")}
${exePlans.map((p) => `- ${p.name} (${p.forTrade}) — à partir de ${euros(p.fromPriceTTC)}. ${p.description}`).join("\n")}

## Études thermiques RE2020
Par le thermicien du bureau d'études. Prix « à partir de », TTC, devis fixe sous 4 h ouvrées.
${thermique.map((t) => `- ${t.name} (${t.when.toLowerCase()}) — à partir de ${euros(t.fromPriceTTC)}. ${t.description}`).join("\n")}

## Pages

${pages.map((p) => `- [${p.path}](${site.url}${p.path}) : ${p.summary}`).join("\n")}

## Articles

${articles
  .map((a) => `- [${a.title}](${site.url}/conseils/${a.slug}) : ${a.description}`)
  .join("\n")}

## Contact

- E-mail : ${site.email}${site.phone ? `\n- Téléphone : ${site.phone}` : ""}
- Zone d'intervention : France entière, à distance. Déplacement possible en ${site.address.region}.${site.social.instagram ? `\n- Instagram : ${site.social.instagram}` : ""}${site.authorSocial.linkedin ? `\n- LinkedIn du maître d'œuvre : ${site.authorSocial.linkedin}` : ""}${site.social.google ? `\n- Fiche Google : ${site.social.google}` : ""}
- Société mère : ${site.parent} — ${site.parentUrl}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
