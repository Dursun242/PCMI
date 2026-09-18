import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/config/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { withSeo } from "@/lib/seo";
import { organizationSchema } from "@/lib/schema";

const home = withSeo("/", {
  title: `Permis de construire maison individuelle — ${site.name}`,
  description:
    "Dossier de permis de construire complet (PCMI 1 à 8), rendus 3D, dépôt et suivi jusqu'à l'accord. Conçu par un maître d'œuvre, partout en France, à prix fixe.",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: String(home.title),
    template: `%s — ${site.name}`,
  },
  description: home.description,
  openGraph: {
    ...home.openGraph,
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: home.alternates,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col">
        <JsonLd data={organizationSchema} />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brass focus:text-paper focus:px-3 focus:py-2"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
