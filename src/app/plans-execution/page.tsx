import type { Metadata } from "next";
import Link from "next/link";
import PlansExeForm from "@/components/PlansExeForm";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { breadcrumb, contactPageSchema, exeServiceSchema, faqPageSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { site, exePlans, exePacks, ht } from "@/config/site";
import { formatEuro } from "@/lib/format";

export const metadata: Metadata = withSeo("/plans-execution", {
  title: "Plans d'exécution maison : ingénieur béton, structure, charpente",
  description:
    "Après le permis, les plans EXE pour construire : fondations, béton armé, plancher, charpente, couverture, électricité, plomberie, VRD. Dessinés par notre dessinateur-projeteur, calculés par notre ingénieur béton armé et structure, à prix fixe, partout en France.",
});

const etapes: [string, string][] = [
  ["Vous nous envoyez le dossier de permis", "Plans PCMI, rapport de sol si vous l'avez, mode constructif retenu. Deux minutes. Si le permis a été fait chez nous, rien à renvoyer."],
  ["Nous chiffrons lot par lot sous 4 h ouvrées", "Un prix fixe par plan, le délai de chacun, et ce que l'ingénieur structure prend en charge."],
  ["Nous dessinons et nous calculons", "Le pôle conception dessine, le bureau d'études dimensionne et signe la note de calcul : les deux sous le même toit, sans aller-retour entre entreprises. Une visio de validation avant l'édition."],
  ["Vous consultez vos artisans sur des plans nets", "PDF et DWG, prêts pour les devis, puis pour le chantier. Une série de modifications incluse."],
];

const faqExe = [
  {
    q: "Les plans du permis ne suffisent-ils pas pour construire ?",
    a: "Non. Les pièces PCMI sont dessinées au 1/100 pour l'instruction en mairie : elles montrent le volume, l'implantation et l'aspect, pas comment porter le plancher ni où passer les évacuations. Le maçon, le charpentier et l'électricien ont besoin de plans d'exécution au 1/50 et de détails au 1/20, cotés et coordonnés entre eux.",
  },
  {
    q: "Qui calcule la structure ?",
    a: "Nous dessinons les plans de fondations, de béton armé, de plancher et de charpente ; le dimensionnement est réalisé par notre bureau d'études structure, qui signe la note de calcul. Dessin et calcul viennent de la même entreprise : ce qui est dessiné est ce qui a été calculé. Le rapport d'étude de sol (mission G2) est nécessaire pour les fondations : nous vous indiquons comment l'obtenir s'il n'existe pas encore.",
  },
  {
    q: "Puis-je commander un seul plan ?",
    a: "Oui. Chaque lot se commande à l'unité, par exemple le seul plan de charpente si votre maçon a déjà ses plans. Les packs regroupent les lots les plus souvent demandés ensemble à un prix inférieur au total des plans pris séparément.",
  },
  {
    q: "Faut-il que le permis ait été fait par vous ?",
    a: "Non. Nous travaillons à partir de n'importe quel dossier de permis accordé, qu'il vienne d'un constructeur, d'un dessinateur ou d'un architecte. Si le permis a été fait chez nous, nous avons déjà tout et le chiffrage est plus rapide.",
  },
  {
    q: "Dans quel format sont livrés les plans ?",
    a: "En PDF à l'échelle pour l'impression et la consultation des artisans, et en DWG pour les entreprises qui travaillent en dessin assisté. Les plans portent un cartouche, un indice et une date : chaque modification est tracée.",
  },
  {
    q: "Ces plans valent-ils une mission de maîtrise d'œuvre d'exécution ?",
    a: "Non. Il s'agit de plans, pas du suivi de chantier ni de la direction des travaux. Vous restez libre de consulter et de coordonner vos artisans, ou de confier cette mission à un maître d'œuvre de votre région.",
  },
];

export default function PlansExecutionPage() {
  return (
    <>
      <JsonLd
        data={[
          exeServiceSchema(),
          faqPageSchema(faqExe),
          contactPageSchema("/plans-execution", "Chiffrer des plans d'exécution"),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Plans d'exécution", path: "/plans-execution" },
          ]),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[16ch]">
            Après le permis, les plans pour <em>construire</em>.
          </h1>
          <p className="lead mt-8 max-w-[54ch]">
            Un permis accordé dit ce que vous avez le droit de bâtir. Il ne dit pas comment. Les plans d&apos;exécution
            (phase EXE) sont ceux que lisent le maçon, le charpentier, le couvreur et l&apos;électricien : fondations,
            béton armé, plancher, charpente, réseaux, détails. Chez {site.name}, ils sont dessinés et calculés sous le même toit :
            le dessinateur-projeteur les trace, l&apos;ingénieur béton armé et structure dimensionne ce qui porte, et le prix est fixé lot par
            lot avant de commencer.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#chiffrer" className="btn btn-ink">Chiffrer mes plans</a>
            <a href="#catalogue" className="btn btn-line">Voir les plans proposés</a>
          </div>
        </div>
      </section>

      <section id="catalogue" className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24 scroll-mt-24">
        <div className="max-w-[60ch]">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Dix plans, un par corps de métier</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Chaque lot se commande seul ou dans un pack. Les prix sont indiqués <strong className="text-ink">à partir de</strong>,
            TTC ; le devis exact dépend de la taille de la maison, du mode constructif et du niveau de détail attendu par
            vos artisans. Les lots marqués d&apos;un astérisque comprennent le calcul de notre bureau d&apos;études structure.
          </p>
        </div>
        <dl className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {exePlans.map((p) => (
            <div key={p.id} id={p.id} className="border-t border-ink pt-5 scroll-mt-24">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="display text-2xl leading-tight">
                  {p.name}
                  {p.withBet ? <span className="text-brass" aria-label="avec calcul du bureau d'études"> *</span> : null}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-2">à partir de</span>
                  <span className="numeral text-2xl">{formatEuro(p.fromPriceTTC)}</span>
                </span>
              </dt>
              <dd className="mt-2">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brass">{p.forTrade}</span>
                <p className="mt-2 leading-relaxed text-ink-2">{p.description}</p>
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {p.deliverables.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span className="mt-[0.7em] h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-ink-2">
          * Dimensionnement et note de calcul par notre bureau d&apos;études structure, inclus dans le prix.
          Prix TTC, TVA 20 % incluse.
        </p>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Deux packs pour aller plus vite</h2>
          <div className="mt-12 grid gap-8 lg:gap-0 lg:grid-cols-2">
            {exePacks.map((pack, i) => (
              <article
                key={pack.id}
                id={pack.id}
                className={`flex flex-col px-6 py-8 sm:px-8 sm:py-10 border-t scroll-mt-24 ${i === 1 ? "border-brass bg-paper" : "border-ink"}`}
              >
                <h3 className="display text-3xl">{pack.name}</h3>
                <p className="mt-2 text-ink-2">{pack.promise}</p>
                <div className="mt-7 flex items-baseline gap-2">
                  <span className="text-xs font-bold tracking-[0.1em] uppercase text-ink-2">à partir de</span>
                  <span className="numeral text-5xl">{formatEuro(pack.fromPriceTTC)}</span>
                  <span className="text-xs font-bold tracking-[0.1em] uppercase text-ink-2">TTC</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  soit {formatEuro(ht(pack.fromPriceTTC))} HT. Livré sous {pack.delayWorkingDays}.
                </p>
                <ul className="mt-8 grid gap-2.5 text-[0.95rem]">
                  {pack.includes.map((id) => {
                    const lot = exePlans.find((p) => p.id === id);
                    return lot ? (
                      <li key={id} className="flex gap-3">
                        <span className="mt-[0.7em] h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
                        <span>{lot.name}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
                <div className="mt-auto pt-9">
                  <a href="#chiffrer" className={`btn w-full ${i === 1 ? "btn-ink" : "btn-line"}`}>
                    Chiffrer le {pack.name.toLowerCase()}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Comment ça se passe</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Le même principe que pour le permis : un prix annoncé avant de commencer, un interlocuteur unique, des
            plans livrés à date. Vous pouvez commander vos plans d&apos;exécution dès l&apos;accord du permis, ou en
            même temps que le dossier de permis pour gagner plusieurs semaines sur le démarrage du chantier.
          </p>
        </div>
        <ol className="grid gap-7 border-t border-ink pt-8">
          {etapes.map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="numeral text-3xl text-brass w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="display text-2xl leading-tight">{t}</div>
                <div className="mt-1 text-ink-2 text-[0.95rem] leading-relaxed">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="chiffrer" className="bg-stone border-y border-stone-2 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Votre devis EXE sous 4 h ouvrées</h2>
            <p className="mt-6 text-ink-2 leading-relaxed">
              Cochez les plans qu&apos;il vous faut, dites-nous où en est votre permis et joignez vos plans si vous les
              avez. Nous revenons vers vous avec un prix fixe par lot.
            </p>
            <div className="mt-10 border-t border-stone-2 pt-6">
              <p className="display text-2xl">Pas encore de permis ?</p>
              <p className="mt-1 text-sm text-ink-2">
                Commencez par le dossier de permis : nos trois formules à prix fixe couvrent la maison jusqu&apos;à 149 m².
                Les plans d&apos;exécution peuvent être chiffrés dans le même devis.
              </p>
              <Link href="/tarifs" className="btn btn-line mt-4 !min-h-11">Voir les formules permis</Link>
            </div>
            <Garanties className="mt-12" />
          </div>
          <div className="bg-paper px-6 py-8 sm:px-10 sm:py-12">
            <PlansExeForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Questions fréquentes</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Pour comprendre ce que contient le dossier de permis lui-même, lisez le{" "}
            <Link href="/permis-de-construire-maison" className="text-ink underline decoration-brass underline-offset-4">
              guide du permis de construire de maison individuelle
            </Link>
            .
          </p>
        </div>
        <Faq items={faqExe} />
      </section>
    </>
  );
}
