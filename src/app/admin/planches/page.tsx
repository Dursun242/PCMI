import AdminShell from "@/components/admin/AdminShell";
import { PLANCHES } from "@/lib/planche";
import { githubConfigure } from "@/lib/plancheGithub";
import { dechiffrer, secretPlanche } from "@/lib/plancheSecret";
import { listerPlanches, type StatutPlanche } from "@/lib/plancheStore";

/** Toujours à jour : le registre est relu à chaque ouverture de la page. */
export const dynamic = "force-dynamic";

export const metadata = { title: "Planches gratuites", robots: { index: false, follow: false } };

const STATUTS: Record<StatutPlanche, { libelle: string; classe: string }> = {
  en_cours: { libelle: "En cours", classe: "text-bronze" },
  livree: { libelle: "Envoyée", classe: "text-forest" },
  echec: { libelle: "À faire à la main", classe: "text-alert font-bold" },
};

const date = (t: number) =>
  new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function contact(chiffre: string | null, secret: string | null): { nom: string; email: string } | null {
  const texte = chiffre && secret ? dechiffrer(chiffre, secret) : null;
  if (!texte) return null;
  try {
    const c = JSON.parse(texte) as { prenom: string; nom: string; email: string };
    return { nom: `${c.prenom} ${c.nom}`, email: c.email };
  } catch {
    return null;
  }
}

export default async function PlanchesAdmin() {
  const secret = secretPlanche();
  const entrees = await listerPlanches().catch(() => []);
  const alertes = [
    !secret && "PLANCHE_SECRET (ou ADMIN_SESSION_SECRET) n'est pas renseignée : le service refuse les demandes.",
    !githubConfigure() && "IDPLANS_GITHUB_TOKEN n'est pas renseignée : chaque demande arrive « à faire à la main ».",
    !process.env.BLOB_READ_WRITE_TOKEN && "BLOB_READ_WRITE_TOKEN absente : le registre n'est pas conservé (une planche par parcelle non garantie).",
  ].filter(Boolean) as string[];

  return (
    <AdminShell>
      <h1 className="display mb-2 text-3xl">Planches gratuites</h1>
      <p className="lead mb-8">Une planche par parcelle : situation, masse de l&apos;existant ou coupes du terrain.</p>
      {alertes.map((a) => (
        <p key={a} className="mb-3 border border-alert/40 bg-alert/5 p-4 text-sm text-alert">{a}</p>
      ))}
      {entrees.length === 0 ? (
        <p className="bg-paper p-4 text-sm text-ink-2">Aucune demande pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Terrain</th>
                <th className="p-3">Planche</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {entrees.map((e) => {
                const c = contact(e.contact, secret);
                const s = STATUTS[e.statut];
                return (
                  <tr key={e.id} className="border-b border-stone-2 align-top">
                    <td className="whitespace-nowrap p-3">{date(e.cree)}</td>
                    <td className="p-3">
                      {c ? (
                        <>
                          <span className="font-bold">{c.nom}</span>
                          <br />
                          <a href={`mailto:${c.email}`} className="underline decoration-brass underline-offset-4">{c.email}</a>
                        </>
                      ) : (
                        <span className="text-ink-2">illisible</span>
                      )}
                    </td>
                    <td className="p-3">{e.commune}<br /><span className="text-ink-2">{e.reference}</span></td>
                    <td className="p-3">{PLANCHES[e.planche].titre}</td>
                    <td className={`p-3 ${s.classe}`}>
                      {s.libelle}
                      {e.erreur && <span className="block text-xs font-normal text-ink-2">{e.erreur}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
