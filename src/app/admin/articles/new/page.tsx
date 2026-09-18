import AdminShell from "@/components/admin/AdminShell";
import ArticleForm from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <AdminShell>
      <h1 className="display text-3xl mb-8">Nouvel article</h1>
      <ArticleForm />
    </AdminShell>
  );
}
