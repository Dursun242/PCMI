import type { Metadata } from "next";
import Link from "next/link";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import FicheTerrain from "@/components/terrain/FicheTerrain";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";

const PATH = "/terrain-constructible";
const TITRE = "Mon terrain est-il constructible ?";
const DESCRIPTION =
  "Vérifiez gratuitement si votre terrain est constructible : zone du PLU, inondation, cavités et marnières, argiles, secteur protégé. Aperçu immédiat, fiche PDF.";

export const metadata: Metadata = withSeo(PATH, {
  title: "Terrain constructible ? Vérifiez votre parcelle gratuitement",
  description: DESCRIPTION,
});

const lien = "text-ink underline decoration-brass underline-offset-4";

const DANS_LA_FICHE = [
  "La zone du PLU ou de la carte communale, et ce qu'elle permet",
  "Inondation, cavités et marnières, argiles, mouvements de terrain",
  "Monument historique, site protégé, servitudes",
  "Ce que ça change pour votre projet, en clair",
  "Le lien direct vers le règlement de votre zone",
];

const faq: { q: string; a: string }[] = [
  {
    q: "Comment savoir si un terrain est constructible ?",
    a: "Regardez d'abord la zone du document d'urbanisme : une zone U (urbaine) est constructible a priori, une zone AU l'est sous conditions, une zone A (agricole) ou N (naturelle) ne l'est en principe pas pour une maison. Vérifiez ensuite les risques (inondation, cavités, mouvements de terrain) et les servitudes. Pour une réponse écrite de la mairie, demandez un certificat d'urbanisme opérationnel.",
  },
  {
    q: "La fiche terrain suffit-elle pour acheter ?",
    a: "Non. Elle rassemble les données publiques du Géoportail de l'urbanisme et de Géorisques pour repérer les points à vérifier avant de signer. Seul un certificat d'urbanisme délivré par la mairie fait foi, et seule une étude de sol renseigne sur le sous-sol.",
  },
  {
    q: "Qu'est-ce qu'une marnière et pourquoi est-ce important en Normandie ?",
    a: "Une marnière est une ancienne carrière souterraine creusée pour extraire la craie. Elles sont très nombreuses en Seine-Maritime et dans l'Eure, souvent oubliées, et peuvent s'effondrer. Autour d'un indice de cavité, la commune applique en général un périmètre de sécurité qui rend le terrain inconstructible tant qu'une étude ne l'a pas levé.",
  },
  {
    q: "Qu'impose le risque d'argiles ?",
    a: "En zone d'exposition moyenne ou forte au retrait-gonflement des argiles, le vendeur d'un terrain constructible doit fournir une étude géotechnique préalable, et la maison doit être fondée en conséquence, souvent avec une étude de conception avant les travaux.",
  },
  {
    q: "Mon terrain est en zone agricole : puis-je construire ?",
    a: "En principe non pour une maison, sauf si vous êtes exploitant agricole et que la maison est nécessaire à l'exploitation. Les extensions et annexes d'une maison existante restent souvent possibles, dans des limites fixées par le règlement de la zone.",
  },
];

export default function TerrainConstructiblePage() {
  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(PATH, "Fiche terrain : mon terrain est-il constructible ?", DESCRIPTION, "UtilitiesApplication"),
          faqPageSchema(faq),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Terrain constructible", path: PATH },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
          <div>
            <span className="rule" aria-hidden="true" />
            <h1 className="display mt-7 text-5xl sm:text-6xl">{TITRE}</h1>
            <p className="lead mt-7 max-w-[60ch]">
              Saisissez l&apos;adresse du terrain : vous voyez tout de suite sa zone dans le PLU et ses risques
              (inondation, cavités et marnières, argiles, secteur protégé). La fiche complète, avec ce que ça change pour
              votre projet, vous est envoyée gratuitement en PDF.
            </p>
          </div>
          <aside className="self-end border-t border-ink pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Dans la fiche</p>
            <ul className="mt-4 grid gap-2.5 text-[0.95rem] leading-snug">
              {DANS_LA_FICHE.map((m) => (
                <li key={m} className="flex gap-3">
                  <span className="mt-2 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section id="formulaire" className="mt-14 scroll-mt-24 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Analyser mon terrain">
          <FicheTerrain />
        </section>
        <p className="mt-4 max-w-[80ch] text-sm text-ink-2">
          Données publiques du Géoportail de l&apos;urbanisme (IGN) et de Géorisques, lues au moment de votre recherche.
          Fiche indicative : seul un certificat d&apos;urbanisme fait foi. Besoin d&apos;un plan du terrain ? Voir nos{" "}
          <Link href="/plans-gratuits" className={lien}>plans gratuits</Link>.
        </p>
      </div>

      <section className="border-y border-stone-2 bg-stone">
        <article className="prose-guide mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2>Ce que dit la zone du PLU</h2>
          <p>
            Le plan local d&apos;urbanisme découpe la commune en zones. Une zone <strong>U</strong> est déjà urbanisée :
            on y construit a priori, en respectant le règlement (implantation, hauteur, emprise, aspect). Une zone{" "}
            <strong>AU</strong> est à urbaniser : ouverte, elle est constructible sous conditions ; fermée, elle attend une
            modification du PLU. Les zones <strong>A</strong> (agricoles) et <strong>N</strong> (naturelles) ne
            permettent en principe pas de construire une maison.
          </p>
          <p>
            Sans PLU, une carte communale distingue les secteurs constructibles des autres. Sans aucun document, c&apos;est
            le règlement national d&apos;urbanisme : on ne construit en principe que dans les parties déjà urbanisées de la
            commune. Pour lire le règlement de votre zone, suivez notre article sur{" "}
            <Link href="/conseils/lire-le-plu-avant-de-dessiner-sa-maison">la lecture du PLU avant de dessiner sa maison</Link>.
          </p>

          <h2>Les risques qui changent tout</h2>
          <p>
            Un terrain en zone urbaine peut rester difficile à bâtir. Un <strong>plan de prévention des risques</strong>{" "}
            peut imposer une hauteur de plancher, interdire un sous-sol, voire rendre une partie du terrain
            inconstructible. En Normandie, les <strong>marnières</strong>, anciennes carrières de craie, entraînent un
            périmètre de sécurité autour de chaque indice. Et en zone d&apos;argiles moyennes ou fortes, une étude de sol
            est obligatoire avant la vente et conditionne les fondations.
          </p>

          <h2>Le certificat d&apos;urbanisme, pour être sûr</h2>
          <p>
            La fiche repère les points à vérifier ; la réponse officielle vient de la mairie. Le certificat
            d&apos;urbanisme opérationnel dit si votre projet précis est réalisable sur le terrain, et fige les règles
            pendant 18 mois. Demandez-le avant de signer l&apos;acte de vente, ou faites-en une condition suspensive du
            compromis.
          </p>

          <h2>Questions fréquentes</h2>
          {faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Le terrain est le bon ? Passons au permis</h2>
        <p className="mt-6 max-w-[62ch] leading-relaxed text-ink-2">
          Nous montons votre dossier de permis de construire, pièces PCMI 1 à 8, en tenant compte du PLU et des risques de
          votre terrain. Prix fixe annoncé avant de commencer, payable en 1, 4 ou 10 fois.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/commander" className="btn btn-ink">Commander mon permis</Link>
          <Link href="/tarifs" className="btn btn-line">Voir les tarifs</Link>
        </div>
        <Garanties className="mt-16" />
      </section>
    </>
  );
}
