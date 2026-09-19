import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { sitemapPages } from "@/config/pages";
import { getArticles } from "@/lib/articles";

/**
 * Les pages statiques portent la date de leur dernier changement de contenu
 * (maintenue dans src/config/pages.ts), pas celle du build : sept pages
 * « modifiées » à la même seconde à chaque déploiement ne disent rien à un
 * moteur. Les articles portent leur propre `updated`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  // L'index des conseils change dès qu'un article change : sa date se déduit.
  const dernierArticle = articles[0]?.updated ?? articles[0]?.date;

  return [
    ...sitemapPages.map((p) => {
      const date =
        p.path === "/conseils" && dernierArticle && dernierArticle > p.lastModified ? dernierArticle : p.lastModified;
      return {
        url: `${site.url}${p.path}`,
        lastModified: new Date(date),
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      };
    }),
    ...articles.map((a) => ({
      url: `${site.url}/conseils/${a.slug}`,
      lastModified: new Date(a.updated ?? a.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
