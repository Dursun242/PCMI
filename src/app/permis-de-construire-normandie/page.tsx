import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import Cta from "@/components/Cta";
import Garanties from "@/components/Garanties";
import TrackedLink from "@/components/TrackedLink";
import { plans, site } from "@/config/site";
import { chiffresNormandie, delaiAbf, departements, faqNormandie } from "@/config/normandie";
import { NORMANDIE_PATH, getVille, villePath, villesDu } from "@/lib/normandie";
import { breadcrumb, faqPageSchema, localServiceSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { formatEuro } from "@/lib/format";

const description = `Permis de construire de maison en Normandie par un bureau d'études du Havre : PLUi, marnières, zones inondables et ABF vérifiés. Prix fixe, dès ${formatEuro(plans[0].priceTTC)}.`;

export const metadata: Metadata = withSeo(NORMANDIE_PATH, {
  title: "Permis de construire maison en Normandie, prix fixe",
  description,
});

const lien = "text-ink underline decoration-brass underline-offset-4";

/** Ce qui distingue un permis normand : chaque point renvoie aux villes qui l'illustrent. */
const specificites: { titre: string; texte: string; villes: string[] }[] = [
  {
    titre: "Le sous-sol avant la façade",
    texte:
      "Marnières et anciennes carrières sont nombreuses en Seine-Maritime, dans l'Eure et sous Caen. Autour d'un indice de cavité, un périmètre de risque peut interdire de construire tant qu'une étude n'a pas levé le doute.",
    villes: ["le-havre", "rouen", "evreux", "caen"],
  },
  {
    titre: "L'eau, des fleuves à la mer",
    texte:
      "Seine, Orne, Vire, Touques, Sarthe, Arques : la plupart des grandes villes ont un plan de prévention des inondations, et le littoral ajoute la submersion marine et le recul des falaises.",
    villes: ["dieppe", "cherbourg-en-cotentin", "vernon", "lisieux"],
  },
  {
    titre: "Des centres-villes protégés",
    texte:
      "Le Havre, Rouen, Caen, Bayeux, Honfleur ou Évreux ont un site patrimonial remarquable. Dans ces périmètres et aux abords des monuments historiques, l'Architecte des Bâtiments de France donne son avis et l'instruction prend un mois de plus.",
    villes: ["le-havre", "rouen", "caen", "bayeux", "honfleur", "evreux"],
  },
  {
    titre: "Le littoral, ses villas et ses sites classés",
    texte:
      "Sur la côte, la loi Littoral limite la construction près du rivage, les stations protègent leurs villas, et autour des falaises d'Étretat un site classé impose une autorisation spéciale de l'État pour tout permis.",
    villes: ["etretat", "fecamp", "deauville", "trouville-sur-mer", "cabourg", "granville"],
  },
  {
    titre: "Des documents d'urbanisme qui changent",
    texte:
      "PLUi du Havre en vigueur depuis avril 2026, PLUi de Saint-Lô en 2024, PLUi de Caen la Mer attendu en 2027 : le règlement qui s'applique à votre terrain dépend de la date de la décision.",
    villes: ["le-havre", "saint-lo", "caen"],
  },
];

export default function NormandiePage() {
  return (
    <>
      <JsonLd
        data={[
          localServiceSchema({ path: NORMANDIE_PATH, name: "Permis de construire de maison en Normandie", description }),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Normandie", path: NORMANDIE_PATH },
          ]),
          faqPageSchema(faqNormandie),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
            Seine-Maritime · Calvados · Eure · Manche · Orne
          </p>
          <h1 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl max-w-[20ch]">
            Le permis de construire de votre maison, en Normandie.
          </h1>
          <p className="lead mt-8 max-w-[62ch]">
            {site.name} est né au Havre. Nous connaissons les marnières du pays de Caux, les zones inondables de la
            Seine et les secteurs protégés de nos centres-villes : nous les vérifions avant de dessiner, pas après un
            refus.
          </p>
          <p className="mt-5 max-w-[62ch] text-ink-2 leading-relaxed">
            Dossier PCMI complet à prix fixe, dès {formatEuro(plans[0].priceTTC)} TTC jusqu&apos;à 149 m². Rendez-vous
            à notre bureau du Havre ou en visio, déplacement possible dans toute la région.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <TrackedLink href="/devis" source="normandie" className="btn btn-ink">Demander un devis</TrackedLink>
            <Link href="/tarifs" className="btn btn-line">Voir les formules</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Construire en Normandie, en chiffres</h2>
        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            [chiffresNormandie.permis.toLocaleString("fr-FR"), `maisons autorisées pour des particuliers en ${chiffresNormandie.annee}`],
            [`${chiffresNormandie.prixTerrainM2} €/m²`, "prix moyen du terrain à bâtir"],
            [formatEuro(chiffresNormandie.coutConstruction), "coût moyen de construction d'une maison, hors terrain"],
          ].map(([chiffre, legende]) => (
            <div key={legende} className="border-t border-ink pt-5">
              <dt className="numeral text-4xl">{chiffre}</dt>
              <dd className="mt-2 text-ink-2 leading-relaxed">{legende}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-ink-2">
          Source :{" "}
          <a href={chiffresNormandie.source.url} target="_blank" rel="noopener noreferrer" className={lien}>
            {chiffresNormandie.source.label}
          </a>
          .
        </p>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Ce qui fait un permis normand</h2>
          <dl className="mt-10 grid gap-10 sm:grid-cols-2">
            {specificites.map((s) => (
              <div key={s.titre} className="border-t border-ink pt-5">
                <dt className="display text-2xl leading-tight">{s.titre}</dt>
                <dd className="mt-2 leading-relaxed text-ink-2">
                  {s.texte} Voir :{" "}
                  {s.villes.map((slug, i) => {
                    const v = getVille(slug);
                    return v ? (
                      <span key={slug}>
                        {i > 0 && ", "}
                        <Link href={villePath(v)} className={lien}>{v.nom}</Link>
                      </span>
                    ) : null;
                  })}
                  .
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-[64ch] text-sm text-ink-2 leading-relaxed">
            {delaiAbf.texte}{" "}
            <a href={delaiAbf.source.url} target="_blank" rel="noopener noreferrer" className={lien}>{delaiAbf.source.label}</a>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Votre ville</h2>
        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          {departements.map((d) => {
            const liste = villesDu(d.code);
            if (liste.length === 0) return null;
            return (
              <div key={d.code}>
                <h3 className="display text-3xl">
                  {d.nom} <span className="text-ink-2">({d.code})</span>
                </h3>
                <ul className="mt-5 grid gap-5">
                  {liste.map((v) => (
                    <li key={v.slug} className="border-t border-stone-2 pt-4">
                      <Link href={villePath(v)} className="display text-2xl hover:text-bronze">
                        Permis de construire {v.a}
                      </Link>
                      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">{v.accroche}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-ink-2">
                  Conseil gratuit avant le projet :{" "}
                  <a href={d.caue.url} target="_blank" rel="noopener noreferrer" className={lien}>{d.caue.label}</a>.
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-12 max-w-[64ch] leading-relaxed text-ink-2">
          Votre commune n&apos;est pas dans la liste ? Nous montons des dossiers dans toute la Normandie, et partout en
          France à distance. Les règles générales sont expliquées dans notre{" "}
          <Link href="/permis-de-construire-maison" className={lien}>guide du permis de construire</Link>.
        </p>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Questions fréquentes</h2>
          <div className="mt-10">
            <Faq items={faqNormandie} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-8">
        <Cta
          title="Un terrain en Normandie ?"
          text="Envoyez l'adresse ou la référence cadastrale : nous lisons le règlement applicable et vous répondons sous 4 h ouvrées avec un prix fixe."
          source="normandie_bas"
          secondaryHref="/plan-de-masse"
          secondaryLabel="J'ai déjà un plan"
        />
        <Garanties className="mt-4" />
      </section>
    </>
  );
}
