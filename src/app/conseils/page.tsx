import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { withSeo } from "@/lib/seo";
import { formatFrDate } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { breadcrumb } from "@/lib/schema";

export const metadata: Metadata = withSeo("/conseils", {
  title: "Conseils permis de construire : prix, délais, refus, pièces du dossier",
  description:
    "Articles pratiques écrits par un maître d'œuvre : combien coûte un permis de construire, comment éviter un refus, réussir l'insertion graphique, comprendre le PLU.",
});

export default function ConseilsPage() {
  const articles = getArticles();
  return (
    <>
      <JsonLd data={breadcrumb([{ name: "Accueil", path: "/" }, { name: "Conseils", path: "/conseils" }])} />
      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[14ch]">Conseils d&apos;un maître d&apos;œuvre.</h1>
          <p className="lead mt-8 max-w-[52ch]">
            Ce que nous répondons chaque semaine aux personnes qui font construire : prix, délais, pièces du dossier, refus, règles du PLU.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
        {articles.length === 0 ? (
          <p className="text-ink-2">Les premiers articles arrivent.</p>
        ) : (
          <ul className="grid gap-px border-t border-ink">
            {articles.map((a) => (
              <li key={a.slug} className="border-b border-stone-2 py-8 grid gap-3 md:grid-cols-[180px_1fr] md:gap-10">
                <div className="text-sm text-ink-2">
                  <time dateTime={a.date}>{formatFrDate(a.updated ?? a.date)}</time>
                  <span className="block">{a.readingMinutes} min de lecture</span>
                </div>
                <div>
                  {a.image && (
                    <Link href={`/conseils/${a.slug}`} className="block mb-4 max-w-[360px]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local, hand-authored SVG; next/image blocks SVG optimization by default */}
                      <img src={a.image} alt={a.imageAlt ?? ""} width={1200} height={630} className="w-full h-auto border border-stone-2" />
                    </Link>
                  )}
                  <h2 className="display text-3xl leading-tight">
                    <Link href={`/conseils/${a.slug}`} className="hover:text-brass transition-colors">{a.title}</Link>
                  </h2>
                  <p className="mt-3 text-ink-2 leading-relaxed max-w-[64ch]">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
