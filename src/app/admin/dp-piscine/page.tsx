import AdminShell from "@/components/admin/AdminShell";
import { jourParis, joursAvant } from "@/lib/suivi";
import { compterDp, ETAPES_DP, type CompteursDp } from "@/lib/suiviDp";
import { lireEvenementsDp, suiviDpConfigure } from "@/lib/suiviDpStore";

/** Toujours à jour : les chiffres sont relus à chaque ouverture (gardés quelques minutes en mémoire). */
export const dynamic = "force-dynamic";

export const metadata = { title: "Compteur DP piscine", robots: { index: false, follow: false } };

const titreSection = "mt-12 text-sm text-ink-2";
const part = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Chiffre({ label, valeur, sous }: { label: string; valeur: number | string; sous: string }) {
  return (
    <div className="flex flex-col bg-paper p-4 sm:p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="display mt-4 text-5xl leading-none lining-nums tabular-nums">{valeur}</p>
      <p className="mt-auto pt-3 text-xs text-ink-3">{sous}</p>
    </div>
  );
}

/** Le parcours en entonnoir : chaque étape rapportée aux visites de la page. */
function Parcours({ c }: { c: CompteursDp }) {
  return (
    <ul className="mt-3 border border-stone-2 bg-paper text-sm">
      {ETAPES_DP.map(([etape, libelle]) => (
        <li
          key={etape}
          className="grid grid-cols-[minmax(0,9rem)_1fr_4.5rem] items-center gap-3 border-b border-stone-2 px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,16rem)_1fr_6rem] sm:px-4"
        >
          <span className={`leading-snug ${c[etape] ? "" : "text-ink-3"}`}>{libelle}</span>
          <span className="h-1.5 bg-stone-2" aria-hidden="true">
            <span className="block h-full bg-forest" style={{ width: `${Math.min(100, part(c[etape], c.vue))}%` }} />
          </span>
          <span className="text-right tabular-nums">
            {c[etape]} <span className="text-ink-3">· {part(c[etape], c.vue)} %</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function CompteurDpPiscine() {
  if (!suiviDpConfigure()) {
    return (
      <AdminShell>
        <h1 className="display mb-4 text-4xl sm:text-5xl">DP piscine</h1>
        <p className="border border-alert/40 bg-paper p-4 text-sm text-alert">
          Cloudflare D1 n&apos;est pas relié (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_ID, CLOUDFLARE_D1_TOKEN) : le parcours DP
          piscine n&apos;est pas compté.
        </p>
      </AdminShell>
    );
  }

  const { evenements, tronque } = await lireEvenementsDp();
  const aujourdhui = jourParis(new Date());
  const periodes: [string, string, CompteursDp][] = [
    ["Aujourd'hui", "Auj.", compterDp(evenements, aujourdhui)],
    ["7 jours", "7 j", compterDp(evenements, joursAvant(aujourdhui, 6))],
    ["30 jours", "30 j", compterDp(evenements, joursAvant(aujourdhui, 29))],
    ["Depuis le début", "Total", compterDp(evenements)],
  ];
  const mois = periodes[2][2];

  return (
    <AdminShell>
      <header>
        <h1 className="display text-4xl sm:text-5xl">DP piscine</h1>
        <a href="/dp-piscine" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-ink-2 transition-colors hover:text-ink">
          Voir la page ↗
        </a>
      </header>

      {tronque && (
        <p className="mt-6 border border-alert/40 bg-paper p-3 text-sm text-alert">
          Plus de 20 000 étapes comptées : les plus récentes peuvent manquer
        </p>
      )}

      <h2 className={titreSection}>30 derniers jours</h2>
      <div className="mt-3 grid grid-cols-2 gap-px border border-stone-2 bg-stone-2 lg:grid-cols-4">
        <Chiffre label="Visites" valeur={mois.vue} sous="Une par visiteur et par onglet" />
        <Chiffre label="Dossiers lancés" valeur={mois.lancee} sous={`${part(mois.lancee, mois.vue)} % des visites`} />
        <Chiffre label="Dossiers payés" valeur={mois.paye} sous="Paiements Qonto confirmés" />
        <Chiffre label="Payés / lancés" valeur={mois.lancee ? `${part(mois.paye, mois.lancee)} %` : "—"} sous="Dossiers lancés allés jusqu'au paiement" />
      </div>

      <h2 className={titreSection}>Le parcours, 30 jours</h2>
      <Parcours c={mois} />
      <p className="mt-2 text-xs text-ink-3">Chaque étape rapportée aux visites de la page, dans l&apos;ordre du parcours.</p>

      <h2 className={titreSection}>Par période</h2>
      <table className="mt-3 w-full border-collapse border border-stone-2 bg-paper text-sm">
        <thead>
          <tr className="border-b border-ink/20 text-left text-ink-2">
            <th className="p-2 font-normal sm:p-3">
              <span className="sr-only sm:not-sr-only">Étape</span>
            </th>
            {periodes.map(([p, court]) => (
              <th key={p} className="p-2 text-right font-normal sm:p-3">
                <abbr title={p} className="no-underline sm:hidden">{court}</abbr>
                <span className="hidden sm:inline">{p}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ETAPES_DP.map(([etape, libelle]) => (
            <tr key={etape} className="border-b border-stone-2 last:border-b-0">
              <td className="p-2 sm:p-3">{libelle}</td>
              {periodes.map(([p, , c]) => (
                <td key={p} className={`p-2 text-right tabular-nums sm:p-3 ${c[etape] ? "" : "text-ink-3"}`}>{c[etape]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-8 text-xs leading-relaxed text-ink-3">
        Compté en interne depuis novembre 2026, dans Cloudflare D1 : rien de ce parcours n&apos;est envoyé à Umami,
        Vercel Analytics ni Google, et la clé des liens de suivi ne sort pas du site. Vos propres essais ne comptent pas.
        Aucune donnée personnelle ici : seulement l&apos;étape franchie et le jour. Le détail de chaque dossier arrive par
        e-mail.
      </p>
    </AdminShell>
  );
}
