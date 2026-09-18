import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { isGithubConfigured } from "@/lib/adminContent";

export default function AdminDashboard() {
  const persisted = isGithubConfigured();

  return (
    <AdminShell>
      <h1 className="display text-3xl mb-2">Tableau de bord</h1>
      <p className="lead mb-8">Éditez le contenu du site sans toucher au code.</p>

      {!persisted && (
        <div className="mb-8 border border-alert/40 bg-alert/5 p-4 text-sm text-alert">
          <strong>Attention :</strong> <code>ADMIN_GITHUB_TOKEN</code> / <code>ADMIN_GITHUB_REPO</code> ne sont pas
          configurés. En production (Vercel), les modifications ne seront pas enregistrées durablement. Voir le
          README, section « Espace admin ».
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/articles" className="border border-ink/10 bg-paper p-6 hover:border-brass">
          <h2 className="font-bold text-lg mb-1">Articles</h2>
          <p className="text-sm text-ink-2">Créer, modifier ou supprimer les articles du blog (/conseils).</p>
        </Link>
        <Link href="/admin/chiffres" className="border border-ink/10 bg-paper p-6 hover:border-brass">
          <h2 className="font-bold text-lg mb-1">Chiffres clés</h2>
          <p className="text-sm text-ink-2">Permis déposés, taux d&apos;accord, note Google, affichés sur l&apos;accueil.</p>
        </Link>
        <Link href="/admin/realisations" className="border border-ink/10 bg-paper p-6 hover:border-brass">
          <h2 className="font-bold text-lg mb-1">Réalisations</h2>
          <p className="text-sm text-ink-2">La galerie de projets réels affichée sur l&apos;accueil.</p>
        </Link>
      </div>
    </AdminShell>
  );
}
