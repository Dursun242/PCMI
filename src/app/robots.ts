import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /devis/merci : page de confirmation, sans intérêt pour un moteur et
        // sans contenu propre. /admin : back-office.
        disallow: ["/api/", "/devis/merci", "/admin"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
