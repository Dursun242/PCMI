import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticle, getArticles } from "@/lib/articles";
import { withSeo } from "@/lib/seo";
import { formatFrDate } from "@/lib/format";
import { site } from "@/config/site";
import JsonLd from "@/components/JsonLd";
import ArticleCtaLink from "@/components/ArticleCtaLink";
import { blogPostingSchema, breadcrumb } from "@/lib/schema";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return withSeo(`/conseils/${slug}`, {
    title: a.title,
    description: a.description,
    openGraph: {
      type: "article",
      publishedTime: a.date,
      modifiedTime: a.updated ?? a.date,
      images: a.image ? [{ url: a.image }] : undefined,
    },
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const others = getArticles().filter((x) => x.slug !== a.slug).slice(0, 3);
  const schema = blogPostingSchema({ ...a, wordCount: a.content.split(/\s+/).filter(Boolean).length });

  return (
    <>
      <JsonLd
        data={[
          schema,
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Conseils", path: "/conseils" },
            { name: a.title, path: `/conseils/${a.slug}` },
          ]),
        ]}
      />
      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">
            <Link href="/conseils" className="hover:text-ink">Conseils</Link>
          </p>
          <h1 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl max-w-[22ch]">{a.title}</h1>
          <p className="lead mt-8 max-w-[60ch]">{a.description}</p>
          <p className="mt-6 text-sm text-ink-2">
            Par {site.author}, maître d&apos;œuvre · <time dateTime={a.updated ?? a.date}>{formatFrDate(a.updated ?? a.date)}</time> · {a.readingMinutes} min
          </p>
        </div>
      </section>

      {a.image && (
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-14">
          {/* eslint-disable-next-line @next/next/no-img-element -- local, hand-authored SVG; next/image blocks SVG optimization by default */}
          <img src={a.image} alt={a.imageAlt ?? ""} width={1200} height={630} className="w-full h-auto border border-stone-2" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid gap-14 lg:grid-cols-[1fr_300px]">
        <article className="prose-guide">
          <MDXRemote source={a.content} />
        </article>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-t border-ink pt-5">
            <p className="display text-2xl">Votre permis, à prix fixe.</p>
            <p className="mt-1 text-sm text-ink-2">Trois formules jusqu&apos;à 149 m². Devis sous 4 h ouvrées.</p>
            <ArticleCtaLink slug={a.slug} href="/tarifs" className="btn btn-line mt-5 w-full !min-h-12">Voir les formules</ArticleCtaLink>
            <ArticleCtaLink slug={a.slug} href="/devis" className="btn btn-ink mt-2 w-full !min-h-12">Demander un devis</ArticleCtaLink>
          </div>
          {others.length > 0 && (
            <div className="mt-10">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ink-2">À lire aussi</p>
              <ul className="mt-4 grid gap-4">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/conseils/${o.slug}`} className="display text-xl leading-tight hover:text-brass">{o.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
