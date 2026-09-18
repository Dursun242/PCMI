import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getArticles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const articles = getArticles();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/permis-de-construire-maison`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/devis`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: `${site.url}/dossier`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/conseils`, lastModified: articles[0] ? new Date(articles[0].updated ?? articles[0].date) : now, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((a) => ({
      url: `${site.url}/conseils/${a.slug}`,
      lastModified: new Date(a.updated ?? a.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
