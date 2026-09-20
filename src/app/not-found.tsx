import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const articles = getArticles().slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-20 sm:py-28">
      <span className="rule" aria-hidden="true" />
      <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">Erreur 404</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">Cette page n&apos;existe pas.</h1>
      <p className="lead mt-7">
        Le lien est peut-être ancien, ou l&apos;adresse comporte une faute de frappe. Voici les pages les plus utiles.
      </p>

      <div className="mt-12 grid gap-6 border-t border-ink pt-8">
        {[
          ["/tarifs", "Formules et tarifs", "Les trois formules à prix fixe, le comparatif ligne par ligne et les options."],
          ["/permis-de-construire-maison", "Le guide du permis de construire", "Pièces du dossier, délais d'instruction, affichage, recours, validité."],
          ["/conseils", "Conseils", "Articles pratiques écrits par un maître d'œuvre."],
          ["/devis", "Demander un devis", "Réponse chiffrée sous 4 h ouvrées, sans engagement."],
        ].map(([href, titre, texte]) => (
          <div key={href}>
            <Link href={href} className="display text-2xl hover:text-brass">{titre}</Link>
            <p className="mt-1 text-ink-2 text-[0.95rem] leading-relaxed">{texte}</p>
          </div>
        ))}
      </div>

      {articles.length > 0 && (
        <div className="mt-14 border-t border-stone-2 pt-6">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ink-2">Derniers articles</p>
          <ul className="mt-4 grid gap-3">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/conseils/${a.slug}`} className="underline decoration-brass underline-offset-4 hover:text-brass">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
