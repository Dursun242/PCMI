import AdminShell from "@/components/admin/AdminShell";
import ChiffresForm from "@/components/admin/ChiffresForm";
import { chiffresCles } from "@data/chiffres";

export default function AdminChiffresPage() {
  return (
    <AdminShell>
      <h1 className="display text-3xl mb-2">Chiffres clés</h1>
      <p className="lead mb-8">Affichés sur l&apos;accueil, juste sous le hero. Laissez un champ vide pour le masquer.</p>
      <ChiffresForm chiffres={chiffresCles} />
    </AdminShell>
  );
}
