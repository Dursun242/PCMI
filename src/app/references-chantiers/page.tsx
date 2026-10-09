import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Cta from "@/components/Cta";
import CarteChantiers from "@/components/CarteChantiers";
import carte from "@/config/carte-le-havre.json";
import { AFFICHER_ADRESSES, chantiers } from "@/config/references";
import { site } from "@/config/site";
import { communesAvecChantier, pointsPublics, type FondDeCarte } from "@/lib/carte";
import { breadcrumb, ORG_REF } from "@/lib/schema";
import { withSeo } from "@/lib/seo";

const PATH = "/references-chantiers";
const points = pointsPublics(carte as FondDeCarte, chantiers, AFFICHER_ADRESSES);
const communes = [...communesAvecChantier(chantiers)];

const description = "Les chantiers d'ID Maîtrise autour du Havre, sur une carte : maisons individuelles, immeubles de logements, bureaux. Photos à l'appui.";

export const metadata: Metadata = withSeo(PATH, {
  title: "Références chantiers d'ID Maîtrise autour du Havre",
  description,
});

/** Liste des chantiers pour les moteurs : nom et commune, sans adresse. */
const collection = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${site.url}${PATH}`,
  name: "Références chantiers d'ID Maîtrise",
  inLanguage: "fr-FR",
  isPartOf: { "@id": `${site.url}/#website` },
  about: ORG_REF,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: chantiers.length,
    itemListElement: chantiers.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.titre}, ${c.commune}`,
      image: `${site.url}${c.photo}`,
    })),
  },
};

export default function ReferencesChantiersPage() {
  return (
    <>
      <JsonLd
        data={[
          collection,
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Références chantiers", path: PATH },
          ]),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-20">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
            Le Havre · Pointe de Caux · Estuaire
          </p>
          <h1 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl max-w-[18ch]">
            Nos références de chantiers autour du Havre.
          </h1>
          <p className="lead mt-8 max-w-[62ch]">
            Des chantiers conçus ou suivis par {site.parent}, notre bureau d&apos;études : des maisons individuelles
            surtout, mais aussi des immeubles de logements, des bureaux et des équipements. Touchez un repère pour voir
            la photo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-16">
        <h2 className="sr-only">La carte des chantiers</h2>
        <CarteChantiers points={points} communes={communes} />
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-8">
        <div className="grid gap-10 border-t border-ink pt-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Ce que ces chantiers changent pour votre permis</h2>
          </div>
          <div>
            <p className="lead">
              Chaque chantier passe par les mêmes mains que votre dossier : ceux qui dessinent la maison la calculent et
              suivent sa construction. Nous connaissons les règlements du Havre et des communes voisines, et ce
              qu&apos;un instructeur y regarde.
            </p>
            <p className="mt-5 leading-relaxed text-ink-2">
              Pour un terrain au Havre, voyez aussi{" "}
              <Link href="/permis-de-construire-normandie/le-havre" className="text-ink underline decoration-brass underline-offset-4">
                le permis de construire au Havre
              </Link>{" "}
              : PLUi, marnières et secteurs protégés.
            </p>
          </div>
        </div>

        <Cta
          title="Votre maison sera peut-être la prochaine."
          text="Envoyez l'adresse ou la référence cadastrale de votre terrain : nous lisons le règlement applicable et vous répondons sous 4 h ouvrées avec un prix fixe."
          source="references_chantiers"
          secondaryHref="/tarifs"
          secondaryLabel="Voir les formules"
        />
      </section>
    </>
  );
}
