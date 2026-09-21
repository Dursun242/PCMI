import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/config/site";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import JsonLd from "@/components/JsonLd";
import { withSeo } from "@/lib/seo";
import { organizationSchema, websiteSchema } from "@/lib/schema";

const home = withSeo("/", {
  title: "Permis de construire maison individuelle — prix fixe, partout en France",
  description:
    "Dossier PCMI 1 à 8 complet, rendus 3D, dépôt en mairie et suivi jusqu'à l'accord. Bureau d'études architecture et ingénierie, prix fixe, partout en France.",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  /**
   * Titre simple, sans `template` : le suffixe de marque coûtait 24 caractères
   * (« — Permis by ID Maîtrise ») sur chaque page intérieure, qui passaient
   * ainsi les ~65 caractères affichés par Google et se faisaient tronquer.
   * Google réaffiche de lui-même le nom du site sous le titre, qu'il tire du
   * schéma Organization/WebSite servi par le layout.
   */
  title: String(home.title),
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
        <JsonLd data={[organizationSchema, websiteSchema]} />
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
        <StickyCta />
        <WhatsAppBubble />
        {/* Mesure d'audience sans cookie ni identifiant individuel (Vercel Web Analytics). */}
        <Analytics />
      </body>
    </html>
  );
}
