import type { Metadata } from "next";
import Link from "next/link";
import PlanDeMasseForm from "@/components/PlanDeMasseForm";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import { breadcrumb, contactPageSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata: Metadata = withSeo("/plan-de-masse", {
  title: "Plan de masse de permis de construire : envoyez le vôtre",
  description:
    "Vous avez déjà un plan de masse en PDF ou en DWG ? Envoyez-le en deux minutes : un maître d'œuvre le confronte au PLU de votre commune et vous répond sous 4 h ouvrées.",
});

/** Exigences de l'article R.431-9 du code de l'urbanisme, en langage clair. */
const exigences: [string, string][] = [
  [
    "Des cotes dans les trois dimensions",
    "Longueur, largeur et hauteur de la construction. C'est la mention explicite du texte, et c'est ce qui manque le plus souvent.",
  ],
  [
    "Les distances aux limites séparatives",
    "Cotées depuis chaque façade jusqu'à chaque limite de propriété. L'instructeur ne doit pas avoir à les mesurer lui-même.",
  ],
  [
    "L'échelle et l'orientation",
    "Une échelle normalisée (1/200 ou 1/500 selon la taille du terrain) et la flèche du nord.",
  ],
  [
    "Les travaux extérieurs",
    "Terrasses, piscine, clôtures, accès, places de stationnement, murs de soutènement : tout ce qui touche au sol.",
  ],
  [
    "Les plantations",
    "Celles qui sont maintenues, celles qui sont supprimées, celles qui sont créées. Un arbre abattu sans le dire sur un terrain en espace boisé classé suffit à bloquer un dossier.",
  ],
  [
    "Les constructions existantes conservées",
    "Avec leurs dimensions, même s'il ne s'agit que d'un abri de jardin.",
  ],
  [
    "Les raccordements aux réseaux",
    "Eau potable, électricité, assainissement collectif — ou le dispositif individuel prévu — et la gestion des eaux pluviales.",
  ],
  [
    "La servitude de passage, le cas échéant",
    "Si le terrain n'est pas desservi directement par une voie ouverte à la circulation publique, son emplacement et ses caractéristiques.",
  ],
];

const plansRecus: [string, string][] = [
  [
    "Un plan de géomètre",
    "C'est souvent un plan de bornage ou un relevé topographique : il donne les limites exactes et l'altimétrie, mais aucun projet n'y figure. Excellent point de départ, ce n'est pas encore une pièce PCMI 2.",
  ],
  [
    "Un plan d'implantation de constructeur",
    "La maison y est posée sur la parcelle, mais les cotes aux limites, les niveaux et les réseaux manquent fréquemment. C'est le cas le plus courant, et le plus rapide à compléter.",
  ],
  [
    "Un fichier DWG ou DXF",
    "Nous l'ouvrons directement. Vérifiez seulement qu'il est à l'échelle 1:1 en unités réelles — un dessin sans échelle nous oblige à repartir des cotes écrites.",
  ],
  [
    "Un croquis ou une photo de plan papier",
    "Parfaitement utilisable pour vous répondre, à condition que les cotes soient lisibles. Nous redessinons ensuite au propre.",
  ],
];

export default function PlanDeMassePage() {
  return (
    <>
      <JsonLd
        data={[
          contactPageSchema("/plan-de-masse", "Envoyer un plan de masse pour chiffrage"),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Plan de masse", path: "/plan-de-masse" },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl">
            Vous avez déjà un plan de masse ?
          </h1>
          {/* Réponse d'abord : ce paragraphe répond à la question de la page. */}
          <p className="lead mt-7 max-w-[44ch]">
            Envoyez-le en PDF, DWG, DXF ou en photo. Chez {site.name}, maître d&apos;œuvre, nous le confrontons au
            règlement d&apos;urbanisme de votre commune et vous disons sous 4 h ouvrées ce qu&apos;il permet déjà, ce
            qui lui manque au regard de la pièce PCMI 2, et le prix pour aller jusqu&apos;au dépôt.
          </p>

          <ol className="mt-12 grid gap-7 border-t border-ink pt-8">
            {[
              ["Vous déposez le fichier", "Deux minutes. Pas de compte à créer, pas de formulaire de dix pages."],
              ["Nous le lisons avec le PLU à côté", "Implantation, reculs, emprise au sol, hauteurs, réseaux, eaux pluviales."],
              ["Vous recevez notre retour sous 4 h ouvrées", "Ce qui est conforme, ce qui ne l'est pas, ce qui manque, et le prix pour compléter le dossier."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5">
                <span className="numeral text-3xl text-brass w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="display text-2xl leading-tight">{t}</div>
                  <div className="mt-1 text-ink-2 text-[0.95rem] leading-relaxed">{d}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 border-t border-stone-2 pt-6">
            <p className="display text-2xl">Vous n&apos;avez pas encore de plan ?</p>
            <p className="mt-1 text-sm text-ink-2">
              C&apos;est le cas le plus fréquent, et ce n&apos;est pas un problème : nous dessinons le plan de masse à
              partir du cadastre et de vos souhaits.
            </p>
            <Link href="/devis" className="btn btn-line mt-4 !min-h-11">Demander un devis sans plan</Link>
          </div>
        </div>

        <div className="bg-stone px-6 py-8 sm:px-10 sm:py-12">
          <PlanDeMasseForm />
        </div>
      </div>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24 grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Ce que la pièce PCMI 2 doit montrer</h2>
            <p className="mt-6 text-ink-2 leading-relaxed">
              Le contenu du plan de masse est fixé par l&apos;
              <a
                href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031720797"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-brass underline-offset-4"
              >
                article R.431-9 du code de l&apos;urbanisme
              </a>
              . Voici ce qu&apos;il exige, traduit en langage de chantier — et ce que nous vérifions sur le plan que vous
              nous envoyez.
            </p>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2">
            {exigences.map(([t, d]) => (
              <div key={t} className="border-t border-stone-2 pt-4">
                <dt className="font-bold leading-snug">{t}</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Les plans qu&apos;on nous envoie le plus souvent</h2>
        <p className="mt-6 max-w-[62ch] text-ink-2 leading-relaxed">
          Aucun de ces documents n&apos;est inutile, et aucun n&apos;est disqualifiant. Envoyez ce que vous avez : nous
          vous dirons ce qu&apos;il en reste à faire.
        </p>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2">
          {plansRecus.map(([t, d]) => (
            <div key={t} className="border-t border-ink pt-5">
              <dt className="display text-2xl leading-tight">{t}</dt>
              <dd className="mt-2 leading-relaxed text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 max-w-[62ch] leading-relaxed text-ink-2">
          Pour comprendre comment le plan de masse s&apos;articule avec les sept autres pièces du dossier, lisez notre{" "}
          <Link href="/permis-de-construire-maison" className="text-ink underline decoration-brass underline-offset-4">
            guide du permis de construire de maison individuelle
          </Link>
          . Et si les cotes de votre plan vous posent question, l&apos;article sur{" "}
          <Link
            href="/conseils/surface-de-plancher-emprise-au-sol-surface-taxable"
            className="text-ink underline decoration-brass underline-offset-4"
          >
            la différence entre surface de plancher, emprise au sol et surface taxable
          </Link>{" "}
          explique ce que l&apos;emprise au sol recouvre exactement.
        </p>

        <Garanties className="mt-16" />
      </section>
    </>
  );
}
