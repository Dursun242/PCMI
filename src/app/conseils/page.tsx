import type { Metadata } from "next";
import Link from "next/link";
import { getArticles, type ArticleMeta } from "@/lib/articles";
import { withSeo } from "@/lib/seo";
import { formatFrDate } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { breadcrumb, collectionPageSchema } from "@/lib/schema";

export const metadata: Metadata = withSeo("/conseils", {
  title: "Conseils permis de construire : prix, délais, refus, pièces du dossier",
  description:
    "Articles pratiques écrits par un maître d'œuvre : combien coûte un permis de construire, comment éviter un refus, réussir l'insertion graphique, comprendre le PLU.",
});

/* Visuel de substitution pour les articles sans photo : numéro en chiffres
   Cormorant sur fond pierre, dans l'esprit des cartouches du site. */
function Placeholder({ index, keyword }: { index: number; keyword?: string }) {
  return (
    <div className="relative aspect-[1200/630] w-full overflow-hidden bg-stone border border-stone-2">
      <div className="absolute inset-0 grid place-items-center">
        <span className="numeral text-[6rem] leading-none text-stone-2 select-none">{String(index).padStart(2, "0")}</span>
      </div>
      {keyword && (
        <span className="absolute left-5 bottom-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-brass">{keyword}</span>
      )}
    </div>
  );
}

function ArticleImage({ a, index, priority = false }: { a: ArticleMeta; index: number; priority?: boolean }) {
  if (!a.image) return <Placeholder index={index} keyword={a.keywords[0]} />;
  return (
    <div className="aspect-[1200/630] w-full overflow-hidden border border-stone-2 bg-stone">
      {/* eslint-disable-next-line @next/next/no-img-element -- images locales (SVG dessinés à la main ou uploads admin) */}
      <img
        src={a.image}
        alt={a.imageAlt ?? ""}
        width={1200}
        height={630}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}

function Meta({ a }: { a: ArticleMeta }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink-3">
      <time dateTime={a.updated ?? a.date}>{formatFrDate(a.updated ?? a.date)}</time>
      <span aria-hidden="true" className="h-px w-4 bg-brass" />
      <span>{a.readingMinutes} min de lecture</span>
    </p>
  );
}

export default function ConseilsPage() {
  const articles = getArticles();
  const [featured, ...rest] = articles;

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema(articles),
          breadcrumb([{ name: "Accueil", path: "/" }, { name: "Conseils", path: "/conseils" }]),
        ]}
      />

      {/* En-tête */}
      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="rule" aria-hidden="true" />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass">Le journal du permis</span>
            </div>
            <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[14ch]">Conseils d&apos;un maître d&apos;œuvre.</h1>
            <p className="lead mt-8 max-w-[52ch]">
              Ce que nous répondons chaque semaine aux personnes qui font construire : prix, délais, pièces du dossier, refus, règles du PLU.
            </p>
          </div>
          {articles.length > 0 && (
            <div className="lg:text-right">
              <div className="numeral text-5xl sm:text-6xl">{String(articles.length).padStart(2, "0")}</div>
              <p className="mt-1 text-ink-2">{articles.length > 1 ? "articles publiés" : "article publié"}</p>
            </div>
          )}
        </div>
      </section>

      {articles.length === 0 ? (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
          <p className="text-ink-2">Les premiers articles arrivent.</p>
        </section>
      ) : (
        <>
          {/* Article à la une */}
          <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 sm:pt-20">
            <div className="flex items-center gap-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass">À la une</span>
              <span className="h-px flex-1 bg-ink" aria-hidden="true" />
            </div>
            <article className="group mt-8 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:items-center">
              <Link href={`/conseils/${featured.slug}`} className="block" aria-label={featured.title}>
                <ArticleImage a={featured} index={1} priority />
              </Link>
              <div>
                <Meta a={featured} />
                <h2 className="display mt-5 text-4xl sm:text-5xl leading-[1.02]">
                  <Link href={`/conseils/${featured.slug}`} className="hover:text-brass transition-colors">{featured.title}</Link>
                </h2>
                <p className="mt-6 text-ink-2 leading-relaxed text-lg max-w-[52ch]">{featured.description}</p>
                <Link
                  href={`/conseils/${featured.slug}`}
                  className="mt-8 inline-flex items-center gap-3 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-ink hover:text-brass transition-colors"
                >
                  Lire l&apos;article
                  <span aria-hidden="true" className="h-px w-8 bg-current transition-all group-hover:w-12" />
                </Link>
              </div>
            </article>
          </section>

          {/* Autres articles */}
          {rest.length > 0 && (
            <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
              <div className="flex items-center gap-3">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass">Tous les articles</span>
                <span className="h-px flex-1 bg-ink" aria-hidden="true" />
              </div>
              <ul className="mt-10 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a, i) => (
                  <li key={a.slug} className="group flex flex-col">
                    <Link href={`/conseils/${a.slug}`} className="block" aria-label={a.title}>
                      <ArticleImage a={a} index={i + 2} />
                    </Link>
                    <div className="mt-6 flex flex-col flex-1">
                      <Meta a={a} />
                      <h2 className="display mt-4 text-[1.75rem] leading-[1.08]">
                        <Link href={`/conseils/${a.slug}`} className="hover:text-brass transition-colors">{a.title}</Link>
                      </h2>
                      <p className="mt-3 text-ink-2 leading-relaxed text-[0.97rem] line-clamp-3">{a.description}</p>
                      <div className="mt-auto pt-5">
                        <Link
                          href={`/conseils/${a.slug}`}
                          className="inline-flex items-center gap-3 text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink hover:text-brass transition-colors"
                        >
                          Lire
                          <span aria-hidden="true" className="h-px w-6 bg-current transition-all group-hover:w-10" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Appel à l'action */}
          <section className="bg-forest text-paper">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="rule" aria-hidden="true" />
                <p className="display mt-6 text-3xl sm:text-4xl max-w-[22ch]">Une question sur votre projet&nbsp;? Posez-la à un maître d&apos;œuvre.</p>
                <p className="mt-4 text-paper/75 max-w-[52ch]">
                  Nous lisons le PLU de votre commune et vous répondons sous 48&nbsp;h, sans engagement.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/devis" className="btn btn-paper">Demander un devis</Link>
                <Link href="/contact" className="btn btn-line-light">Nous écrire</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
