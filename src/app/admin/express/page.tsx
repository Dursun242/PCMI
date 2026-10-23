import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import RemiseAZero from "@/components/admin/RemiseAZero";
import { express } from "@/config/site";
import { compter, contacts, jourParis, joursAvant, parJour, tauxContact, type Compteurs } from "@/lib/suivi";
import { lireEvenements, suiviConfigure } from "@/lib/suiviStore";

/** Toujours à jour : les chiffres sont relus à chaque ouverture de la page. */
export const dynamic = "force-dynamic";

export const metadata = { title: "Compteur Express", robots: { index: false, follow: false } };

const LIGNES: { titre: string; valeur: (c: Compteurs) => string; aide?: string }[] = [
  { titre: "Visites", valeur: (c) => String(c.visites), aide: "Une par visiteur et par session." },
  { titre: "dont via Google Ads", valeur: (c) => String(c.visitesAds) },
  { titre: "Formulaires commencés", valeur: (c) => String(c.formulaires) },
  { titre: "Demandes envoyées", valeur: (c) => String(c.demandes) },
  { titre: "dont urgentes", valeur: (c) => String(c.demandesUrgentes), aide: "Compromis signé ou dépôt sous un mois." },
  { titre: "Clics « Appeler »", valeur: (c) => String(c.appels) },
  { titre: "Clics WhatsApp", valeur: (c) => String(c.whatsapp) },
  { titre: "Taux de contact", valeur: (c) => (tauxContact(c) === null ? "—" : `${tauxContact(c)} %`), aide: "Demandes + appels + WhatsApp, rapportés aux visites." },
];

function Chiffre({ label, valeur, sous }: { label: string; valeur: number | string; sous?: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-2">{label}</p>
      <p className="display mt-2 text-5xl leading-none">{valeur}</p>
      {sous && <p className="mt-2 text-xs text-ink-2">{sous}</p>}
    </div>
  );
}

export default async function CompteurExpress() {
  if (!suiviConfigure()) {
    return (
      <AdminShell>
        <h1 className="display text-3xl mb-4">Compteur de la page Express</h1>
        <div className="border border-alert/40 bg-alert/5 p-4 text-sm text-alert">
          Le stockage Vercel Blob n&apos;est pas relié au projet (<code>BLOB_READ_WRITE_TOKEN</code> absent) : aucun
          événement n&apos;est enregistré. Vercel → projet → Storage → créer ou connecter un Blob store, puis redéployer.
        </div>
      </AdminShell>
    );
  }

  const { evenements, tronque, zero } = await lireEvenements();
  const aujourdhui = jourParis(new Date());
  const periodes: [string, Compteurs][] = [
    ["Aujourd'hui", compter(evenements, aujourdhui)],
    ["7 jours", compter(evenements, joursAvant(aujourdhui, 6))],
    ["30 jours", compter(evenements, joursAvant(aujourdhui, 29))],
    ["Depuis le lancement", compter(evenements)],
  ];
  const mois = periodes[2][1];
  const jours = parJour(evenements, aujourdhui, 14);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl">Compteur de la page Express</h1>
          <p className="mt-1 text-sm text-ink-2">
            Campagne Google Ads · formule {express.nom} à {express.prixTTC} € · chiffres à l&apos;heure de Paris
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RemiseAZero />
          <Link href="/permis-express" target="_blank" className="btn btn-line text-sm !min-h-10">
            Voir la page
          </Link>
        </div>
      </div>

      {zero > 0 && (
        <p className="mt-4 text-sm text-ink-2">
          Compté depuis la remise à zéro du{" "}
          {new Date(zero).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" })}.
        </p>
      )}

      {tronque && (
        <p className="mt-6 border border-alert/40 bg-alert/5 p-3 text-sm text-alert">
          Plus de 20 000 événements : les plus récents peuvent manquer.
        </p>
      )}

      <h2 className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">30 derniers jours</h2>
      <div className="mt-3 grid gap-px bg-stone-2 grid-cols-2 lg:grid-cols-4">
        <Chiffre label="Visites" valeur={mois.visites} sous={`${mois.visitesAds} via Google Ads`} />
        <Chiffre label="Contacts" valeur={contacts(mois)} sous={`${mois.demandes} demandes · ${mois.appels} appels · ${mois.whatsapp} WhatsApp`} />
        <Chiffre label="Demandes urgentes" valeur={mois.demandesUrgentes} sous="À rappeler en premier" />
        <Chiffre label="Taux de contact" valeur={tauxContact(mois) === null ? "—" : `${tauxContact(mois)} %`} sous="Contacts / visites" />
      </div>

      <h2 className="mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">Par période</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse bg-paper text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="p-3 font-bold">Indicateur</th>
              {periodes.map(([p]) => (
                <th key={p} className="p-3 text-right font-bold">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIGNES.map((l) => (
              <tr key={l.titre} className="border-b border-stone-2">
                <td className="p-3">
                  <span className={l.titre.startsWith("dont") ? "pl-4 text-ink-2" : "font-bold"}>{l.titre}</span>
                  {l.aide && <span className="block text-xs text-ink-2">{l.aide}</span>}
                </td>
                {periodes.map(([p, c]) => (
                  <td key={p} className="p-3 text-right tabular-nums">{l.valeur(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">Jour par jour (14 jours)</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse bg-paper text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              {["Jour", "Visites", "dont Ads", "Formulaires", "Demandes", "Appels", "WhatsApp"].map((h) => (
                <th key={h} className="p-3 font-bold first:text-left text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jours.map(({ jour, compteurs: c }) => (
              <tr key={jour} className={`border-b border-stone-2 ${c.visites === 0 && contacts(c) === 0 ? "text-ink-3" : ""}`}>
                <td className="p-3">
                  {new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </td>
                {[c.visites, c.visitesAds, c.formulaires, c.demandes, c.appels, c.whatsapp].map((v, i) => (
                  <td key={i} className="p-3 text-right tabular-nums">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-2">
        Un clic sur « Appeler » ou WhatsApp n&apos;est pas forcément un appel abouti : comparez avec votre journal
        d&apos;appels. Les robots (dont celui de Google qui vérifie les annonces) ne sont pas comptés. Aucune donnée
        personnelle n&apos;est enregistrée ici ; le détail de chaque demande arrive par e-mail.
      </p>
    </AdminShell>
  );
}
