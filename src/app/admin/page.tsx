import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { isGithubConfigured } from "@/lib/adminContent";
import { etatConnexion } from "@/lib/qontoConnexion";

// L'état de la connexion Qonto est relu à chaque visite.
export const dynamic = "force-dynamic";

const MESSAGES_QONTO: Record<string, string> = {
  connecte: "Qonto est connecté : la commande en ligne peut créer les mandats SEPA.",
  refuse: "Autorisation refusée chez Qonto : rien n'a changé.",
  erreur: "La connexion à Qonto a échoué. Réessayez ; si cela persiste, vérifiez l'adresse de retour déclarée dans l'application Qonto.",
  "non-configure": "QONTO_CLIENT_ID et QONTO_CLIENT_SECRET ne sont pas renseignées dans Vercel.",
};

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ qonto?: string }> }) {
  const persisted = isGithubConfigured();
  const [{ qonto: retourQonto }, qonto] = await Promise.all([searchParams, etatConnexion()]);
  const messageQonto = retourQonto ? MESSAGES_QONTO[retourQonto] : undefined;

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

      <section className="mb-8 border border-ink/10 bg-paper p-6" aria-labelledby="qonto">
        <h2 id="qonto" className="font-bold text-lg mb-1">Commande en ligne : connexion Qonto</h2>
        {messageQonto && <p role="status" className="mb-3 text-sm font-bold">{messageQonto}</p>}
        <p className="text-sm text-ink-2">
          {!qonto.configuree
            ? "Application Qonto non renseignée (QONTO_CLIENT_ID, QONTO_CLIENT_SECRET)."
            : qonto.connectee
              ? "Connecté. Le site renouvelle seul son accès ; reconnectez seulement si un e-mail d'alerte vous le demande."
              : "Non connecté : la commande en ligne ne peut pas créer de mandat SEPA."}
        </p>
        {qonto.configuree && (
          // Lien classique (pas de Link) : la route renvoie vers Qonto, hors du site.
          <a href="/api/admin/qonto/connexion" className="btn btn-ink mt-4">
            {qonto.connectee ? "Reconnecter Qonto" : "Connecter Qonto"}
          </a>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/express" className="border border-ink/10 bg-paper p-6 hover:border-brass sm:col-span-3">
          <h2 className="font-bold text-lg mb-1">Compteur de la page Express</h2>
          <p className="text-sm text-ink-2">Visites, formulaires, demandes, clics Appeler et WhatsApp de la campagne Google Ads.</p>
        </Link>
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
