import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { sitemapPages } from "@/config/pages";
import { getArticles } from "@/lib/articles";
import { villes, VILLES_LAST_MODIFIED } from "@/config/normandie";
import { villePath } from "@/lib/normandie";
import { chantiers, vitrine } from "@/config/references";

const absolue = (path: string) => `${site.url}${path}`;

/**
 * Images de chaque page, pour Google Images : un sitemap qui les liste aide le
 * moteur à les rattacher à la bonne page, même affichées en carrousel ou en
 * image optimisée (/_next/image).
 */
const IMAGES_PAR_PAGE: Record<string, string[]> = {
  "/": [...vitrine, "/office/bureau-id-maitrise.jpg"],
  "/references-chantiers": [...new Set(chantiers.map((c) => c.photo))],
};

/** Image d'en-tête de l'article, puis les illustrations insérées dans le texte. */
function imagesArticle(a: { image?: string; content: string }): string[] {
  const dansLeTexte = [...a.content.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)/g)].map((m) => m[1]);
  return [...new Set([...(a.image ? [a.image] : []), ...dansLeTexte])];
}

/**
 * Les pages statiques portent la date de leur dernier changement de contenu
 * (maintenue dans src/config/pages.ts), pas celle du build : sept pages
 * « modifiées » à la même seconde à chaque déploiement ne disent rien à un
 * moteur. Les articles portent leur propre `updated`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  // L'index des conseils change dès qu'un article change (titre, chapô) : sa date
  // est la plus récente des dates de publication ou de mise à jour, pas celle du
  // dernier article publié.
  const dernierArticle = articles.map((a) => a.updated ?? a.date).sort().at(-1);

  return [
    ...sitemapPages.map((p) => {
      const date =
        p.path === "/conseils" && dernierArticle && dernierArticle > p.lastModified ? dernierArticle : p.lastModified;
      return {
        url: `${site.url}${p.path}`,
        lastModified: new Date(date),
        changeFrequency: p.changeFrequency,
        priority: p.priority,
        ...(IMAGES_PAR_PAGE[p.path] ? { images: IMAGES_PAR_PAGE[p.path].map(absolue) } : {}),
      };
    }),
    // Pages villes : même date de revue pour toutes, tenue dans src/config/normandie.ts.
    ...villes.map((v) => ({
      url: `${site.url}${villePath(v)}`,
      lastModified: new Date(v.lastModified ?? VILLES_LAST_MODIFIED),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...articles.map((a) => ({
      url: `${site.url}/conseils/${a.slug}`,
      lastModified: new Date(a.updated ?? a.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: imagesArticle(a).map(absolue),
    })),
  ];
}
