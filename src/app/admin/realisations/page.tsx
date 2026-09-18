import AdminShell from "@/components/admin/AdminShell";
import RealisationsManager from "@/components/admin/RealisationsManager";
import { realisations } from "@data/realisations";

export default function AdminRealisationsPage() {
  return (
    <AdminShell>
      <h1 className="display text-3xl mb-2">Réalisations</h1>
      <p className="lead mb-8">
        N&apos;ajoutez que des projets réels, avec des images dont vous détenez les droits, déposées manuellement dans{" "}
        <code>public/realisations/</code>.
      </p>
      <RealisationsManager realisations={realisations} />
    </AdminShell>
  );
}
