import type { Metadata } from "next";
import "./globals.css";
import { cormorant, lato } from "./fonts";
import { plans, site } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { Analytics } from "@vercel/analytics/next";
import UmamiScript from "@/components/UmamiScript";
import MesureSite from "@/components/MesureSite";
import GoogleAds from "@/components/GoogleAds";
import BandeauLancement from "@/components/BandeauLancement";
import HorsPages from "@/components/HorsPages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EnTeteCommande, PiedCommande, SelonTunnel } from "@/components/commande/CadreCommande";
import StickyCta from "@/components/StickyCta";
import SuiteExpress from "@/components/SuiteExpress";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import ScrollReveal from "@/components/ScrollReveal";
import JsonLd from "@/components/JsonLd";
import { withSeo } from "@/lib/seo";
import { organizationSchema, websiteSchema } from "@/lib/schema";

const home = withSeo("/", {
  title: "Permis de construire en ligne pour votre maison, à prix fixe",
  description:
    `Permis de construire de maison en ligne dès ${formatEuro(plans[0].priceTTC)} TTC : dossier PCMI 1 à 8 en ${plans[0].delayWorkingDays.replace(" jours ouvrés", "")} à ${plans[plans.length - 1].delayWorkingDays} par un bureau d'études, devis immédiat, en 1, 4 ou 10 fois sans frais.`,
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

/**
 * Active les apparitions au défilement avant le premier affichage (sinon les
 * blocs s'afficheraient puis disparaîtraient). Si ScrollReveal ne s'est pas
 * signalé au bout de 5 s (JavaScript bloqué, réseau très lent), on rend tout
 * visible : le contenu ne doit jamais rester masqué.
 */
const ACTIVER_ANIMATIONS = `(function(){var h=document.documentElement;if(!("IntersectionObserver" in window))return;h.classList.add("reveal-on");setTimeout(function(){if(!h.hasAttribute("data-reveal-pret"))h.classList.remove("reveal-on")},5000)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessous ajoute une classe à <html> avant React.
    <html lang="fr" className={`${lato.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACTIVER_ANIMATIONS }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brass focus:text-paper focus:px-3 focus:py-2"
        >
          Aller au contenu
        </a>
        {/* Tunnel de commande : en-tête et pied de page réduits (voir CadreCommande). */}
        <SelonTunnel
          tunnel={<EnTeteCommande />}
          ailleurs={
            <>
              <HorsPages chemins={["/permis-express"]}>
                <BandeauLancement />
              </HorsPages>
              <Header />
            </>
          }
        />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SelonTunnel tunnel={<PiedCommande />} ailleurs={<Footer />} />
        <StickyCta />
        <WhatsAppBubble />
        <SuiteExpress />
        <ScrollReveal />
        {/* Mesure d'audience sans cookie ni identifiant individuel (Vercel Web Analytics). */}
        <Analytics />
        <UmamiScript />
        {/* Parcours page par page (lecture, temps, clics, FAQ, vidéos, formulaires), envoyé à Umami. */}
        <MesureSite />
        {/* Conversions Google Ads, soumises au consentement (bannière incluse). */}
        <GoogleAds />
      </body>
    </html>
  );
}
