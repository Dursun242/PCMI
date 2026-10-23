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

function libelleJour(jour: string) {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function Chiffre({ label, valeur, sous }: { label: string; valeur: number | string; sous?: string }) {
  return (
    <div className="bg-paper p-4 sm:p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-2">{label}</p>
      <p className="display mt-2 text-4xl leading-none sm:text-5xl">{valeur}</p>
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
  // [titre, titre court pour téléphone, compteurs]
  const periodes: [string, string, Compteurs][] = [
    ["Aujourd'hui", "Auj.", compter(evenements, aujourdhui)],
    ["7 jours", "7 j", compter(evenements, joursAvant(aujourdhui, 6))],
    ["30 jours", "30 j", compter(evenements, joursAvant(aujourdhui, 29))],
    [zero > 0 ? "Depuis la remise à zéro" : "Depuis le lancement", "Total", compter(evenements)],
  ];
  const mois = periodes[2][2];
  const jours = parJour(evenements, aujourdhui, 14);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-2xl sm:text-3xl">Compteur de la page Express</h1>
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

      <h2 className="mt-8 sm:mt-10 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">30 derniers jours</h2>
      <div className="mt-3 grid gap-px bg-stone-2 grid-cols-2 lg:grid-cols-4">
        <Chiffre label="Visites" valeur={mois.visites} sous={`${mois.visitesAds} via Google Ads`} />
        <Chiffre label="Contacts" valeur={contacts(mois)} sous={`${mois.demandes} demandes · ${mois.appels} appels · ${mois.whatsapp} WhatsApp`} />
        <Chiffre label="Demandes urgentes" valeur={mois.demandesUrgentes} sous="À rappeler en premier" />
        <Chiffre label="Taux de contact" valeur={tauxContact(mois) === null ? "—" : `${tauxContact(mois)} %`} sous="Contacts / visites" />
      </div>

      <h2 className="mt-10 sm:mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">Par période</h2>
      {/* Titres courts et explications masquées sur téléphone : le tableau tient dans l'écran. */}
      <table className="mt-3 w-full border-collapse bg-paper text-sm">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="p-2 font-bold sm:p-3">
              <span className="sr-only sm:not-sr-only">Indicateur</span>
            </th>
            {periodes.map(([p, court]) => (
              <th key={p} className="p-2 text-right font-bold sm:p-3">
                <abbr title={p} className="no-underline sm:hidden">{court}</abbr>
                <span className="hidden sm:inline">{p}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIGNES.map((l) => (
            <tr key={l.titre} className="border-b border-stone-2">
              <td className="p-2 sm:p-3">
                <span className={l.titre.startsWith("dont") ? "pl-3 text-ink-2 sm:pl-4" : "font-bold"}>{l.titre}</span>
                {l.aide && <span className="hidden text-xs text-ink-2 sm:block">{l.aide}</span>}
              </td>
              {periodes.map(([p, , c]) => (
                <td key={p} className="p-2 text-right tabular-nums whitespace-nowrap sm:p-3">{l.valeur(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 sm:mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink-2">Jour par jour (14 jours)</h2>
      {/* Téléphone : une ligne par jour, visites à gauche, contacts à droite. */}
      <ul className="mt-3 bg-paper text-sm sm:hidden">
        {jours.map(({ jour, compteurs: c }) => {
          const vide = c.visites === 0 && contacts(c) === 0;
          const detail = [
            c.demandes > 0 && `${c.demandes} demande${c.demandes > 1 ? "s" : ""}`,
            c.appels > 0 && `${c.appels} appel${c.appels > 1 ? "s" : ""}`,
            c.whatsapp > 0 && `${c.whatsapp} WhatsApp`,
          ].filter(Boolean);
          return (
            <li key={jour} className={`flex items-baseline justify-between gap-3 border-b border-stone-2 px-3 py-2.5 ${vide ? "text-ink-3" : ""}`}>
              <div>
                <p className="font-bold">{libelleJour(jour)}</p>
                {!vide && (
                  <p className="text-xs text-ink-2">
                    {c.visitesAds} via Ads · {c.formulaires} formulaire{c.formulaires > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="tabular-nums">
                  <strong>{c.visites}</strong> visite{c.visites > 1 ? "s" : ""}
                </p>
                {detail.length > 0 && <p className="text-xs font-bold text-forest">{detail.join(" · ")}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 hidden sm:block">
        <table className="w-full border-collapse bg-paper text-sm">
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
                <td className="p-3">{libelleJour(jour)}</td>
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
