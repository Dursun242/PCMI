import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import Cta from "@/components/Cta";
import Garanties from "@/components/Garanties";
import SourcedFact from "@/components/SourcedFact";
import TrackedLink from "@/components/TrackedLink";
import { plans } from "@/config/site";
import { chiffresNormandie, villes, type Departement, type Source } from "@/config/normandie";
import { NORMANDIE_PATH, departementDe, getVille, villeDescription, villePath, villeTitle, villesDu } from "@/lib/normandie";
import { breadcrumb, faqPageSchema, localServiceSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { formatEuro } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return villes.map((v) => ({ ville: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const v = getVille((await params).ville);
  if (!v) return {};
  return withSeo(villePath(v), { title: villeTitle(v), description: villeDescription(v) });
}

const lien = "text-ink underline decoration-brass underline-offset-4";

/** Chiffres du département quand l'enquête EPTB les donne, sinon ceux de la région. */
function chiffresLocaux(d: Departement): { lignes: [string, string][]; source: Source } {
  const t = d.terrain;
  if (t) {
    return {
      source: t.source,
      lignes: [
        [`${t.prixM2} €/m²`, `prix moyen du terrain à bâtir en ${d.nom} en ${t.annee}`],
        [`${t.surfaceM2.toLocaleString("fr-FR")} m²`, "surface moyenne d'un terrain de maison neuve"],
        ...(t.permis ? [[t.permis.toLocaleString("fr-FR"), `maisons autorisées pour des particuliers en ${t.annee}`] as [string, string]] : []),
      ],
    };
  }
  const n = chiffresNormandie;
  return {
    source: n.source,
    lignes: [
      [`${n.prixTerrainM2} €/m²`, `prix moyen du terrain à bâtir en Normandie en ${n.annee}`],
      [n.permis.toLocaleString("fr-FR"), `maisons autorisées pour des particuliers en Normandie en ${n.annee}`],
      [formatEuro(n.coutConstruction), "coût moyen de construction d'une maison, hors terrain"],
    ],
  };
}

export default async function VillePage({ params }: { params: Promise<{ ville: string }> }) {
  const v = getVille((await params).ville);
  if (!v) notFound();
  const d = departementDe(v);
  const voisines = villesDu(v.departement).filter((x) => x.slug !== v.slug);
  const source = `ville_${v.slug}`;
  const chiffres = chiffresLocaux(d);

  return (
    <>
      <JsonLd
        data={[
          localServiceSchema({ path: villePath(v), name: `Permis de construire de maison ${v.a}`, description: v.description, ville: v.nom }),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Normandie", path: NORMANDIE_PATH },
            { name: v.nom, path: villePath(v) },
          ]),
          faqPageSchema(v.faq),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
            <Link href={NORMANDIE_PATH} className="hover:text-ink">Normandie</Link> · {d.nom} ({d.code})
          </p>
          <h1 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl max-w-[22ch]">
            Le permis de construire de votre maison {v.a}.
          </h1>
          <p className="lead mt-8 max-w-[62ch]">{v.accroche}</p>
          <p className="mt-5 max-w-[62ch] text-ink-2 leading-relaxed">
            Notre bureau d&apos;études est au Havre : nous lisons le règlement de votre terrain avant de chiffrer, puis
            montons le dossier PCMI complet à prix fixe, dès {formatEuro(plans[0].priceTTC)} TTC.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <TrackedLink href="/devis" source={source} className="btn btn-ink">Demander un devis</TrackedLink>
            <Link href="/tarifs" className="btn btn-line">Voir les formules</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 grid gap-14 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Les règles qui s&apos;appliquent {v.a}</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            {v.nom} fait partie de {v.intercommunalite}. C&apos;est le document d&apos;urbanisme local, et non une règle
            nationale, qui fixe ce que vous pouvez construire sur votre parcelle : implantation, hauteur, emprise au sol,
            aspect des façades.
          </p>
        </div>
        <div data-stagger className="grid gap-6">
          <SourcedFact titre="Le document d'urbanisme" fait={v.urbanisme} />
          <SourcedFact titre="Où déposer votre demande" fait={v.depot} />
        </div>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 grid gap-14 lg:grid-cols-2">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Ce qu&apos;il faut vérifier sur votre terrain</h2>
            <div data-stagger className="mt-8 grid gap-6">
              {v.risques.map((f) => <SourcedFact key={f.texte} fait={f} />)}
            </div>
          </div>
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Patrimoine et aspect extérieur</h2>
            <div data-stagger className="mt-8 grid gap-6">
              {v.patrimoine.map((f) => <SourcedFact key={f.texte} fait={f} />)}
              {v.architecture && <SourcedFact fait={v.architecture} />}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Construire en {d.terrain ? d.nom : "Normandie"}, en chiffres</h2>
        <dl data-stagger className="mt-10 grid gap-8 sm:grid-cols-3">
          {chiffres.lignes.map(([chiffre, legende]) => (
            <div key={legende} className="border-t border-ink pt-5">
              <dt className="numeral text-4xl">{chiffre}</dt>
              <dd className="mt-2 text-ink-2 leading-relaxed">{legende}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[64ch] text-sm text-ink-2 leading-relaxed">
          Source :{" "}
          <a href={chiffres.source.url} target="_blank" rel="noopener noreferrer" className={lien}>{chiffres.source.label}</a>
          .{" "}
          Pour un premier avis gratuit sur l&apos;insertion de votre maison, le{" "}
          <a href={d.caue.url} target="_blank" rel="noopener noreferrer" className={lien}>{d.caue.label}</a> reçoit les
          particuliers ; nous prenons ensuite le relais pour le dossier.
        </p>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Votre dossier {v.a}, à prix fixe</h2>
            <p className="mt-6 text-ink-2 leading-relaxed">
              Le prix ne dépend ni de la commune ni de la surface, jusqu&apos;à 149 m² de surface de plancher. Échanges en
              visio ou à notre bureau du Havre ; déplacement possible en Normandie.
            </p>
          </div>
          <ul data-stagger className="grid gap-5 sm:grid-cols-3">
            {plans.map((p) => (
              <li key={p.id} className="border-t border-ink pt-5">
                <p className="display text-2xl">{p.name}</p>
                <p className="numeral mt-1 text-3xl">{formatEuro(p.priceTTC)}</p>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{p.promise}</p>
                <Link href={`/tarifs#${p.id}`} className={`mt-3 inline-block text-sm ${lien}`}>Le détail de la formule {p.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Questions fréquentes {v.a}</h2>
        <div className="mt-10">
          <Faq items={v.faq} />
        </div>

        <p className="mt-12 max-w-[64ch] leading-relaxed text-ink-2">
          Nous montons aussi des dossiers {v.autour} : {v.communesVoisines.join(", ")}.
          {voisines.length > 0 && (
            <>
              {" "}Ailleurs en {d.nom} :{" "}
              {voisines.map((x, i) => (
                <span key={x.slug}>
                  {i > 0 && ", "}
                  <Link href={villePath(x)} className={lien}>{x.nom}</Link>
                </span>
              ))}
              .
            </>
          )}{" "}
          Toutes les villes : <Link href={NORMANDIE_PATH} className={lien}>le permis de construire en Normandie</Link>. Les
          règles générales sont dans notre{" "}
          <Link href="/permis-de-construire-maison" className={lien}>guide du permis de construire</Link>.
        </p>

        <Cta
          title={`Un terrain ${v.a} ?`}
          text="Envoyez l'adresse ou la référence cadastrale : nous lisons le règlement applicable et vous répondons sous 4 h ouvrées avec un prix fixe."
          source={`${source}_bas`}
          secondaryHref="/plan-de-masse"
          secondaryLabel="J'ai déjà un plan"
        />
        <Garanties className="mt-4" />
      </section>
    </>
  );
}
