import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  const articles = getArticles();

  return (
    <AdminShell>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="display text-3xl">Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-ink">
          Nouvel article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-ink-2">Aucun article pour le moment.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border border-ink/10 bg-paper">
          {articles.map((a) => (
            <li key={a.slug} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <Link href={`/admin/articles/${a.slug}`} className="font-bold hover:text-forest">
                  {a.title}
                </Link>
                <p className="text-sm text-ink-2">{a.date}</p>
              </div>
              <Link href={`/conseils/${a.slug}`} target="_blank" className="text-sm text-ink-2 underline shrink-0">
                Voir en ligne
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
