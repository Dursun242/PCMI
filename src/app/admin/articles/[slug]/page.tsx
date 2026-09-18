import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ArticleForm from "@/components/admin/ArticleForm";
import { getAdminArticle } from "@/lib/adminContent";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getAdminArticle(slug);
  if (!article) notFound();

  return (
    <AdminShell>
      <h1 className="display text-3xl mb-8">Modifier « {article.title} »</h1>
      <ArticleForm article={article} />
    </AdminShell>
  );
}
