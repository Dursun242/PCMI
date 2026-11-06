import AdminShell from "@/components/admin/AdminShell";
import AnalyseExpress from "@/components/admin/AnalyseExpress";
import RemiseAZero from "@/components/admin/RemiseAZero";
import { express } from "@/config/site";
import { analyser } from "@/lib/bilan";
import { analyserSuites } from "@/lib/suite";
import { compter, contacts, jourParis, joursAvant, parJour, tauxContact, TRANCHES_TEMPS, type Compteurs } from "@/lib/suivi";
import { lireEvenements, suiviConfigure } from "@/lib/suiviStore";

/** Toujours à jour : les chiffres sont relus à chaque ouverture de la page. */
export const dynamic = "force-dynamic";

export const metadata = { title: "Compteur Express", robots: { index: false, follow: false } };

const titreSection = "mt-12 text-sm text-ink-2";
const entete = "border-b border-ink/20 text-left text-ink-2";

/** « 21,4 % », ou un tiret sans visite. */
function taux(c: Compteurs) {
  const t = tauxContact(c);
  return t === null ? "—" : `${t.toLocaleString("fr-FR")} %`;
}

const LIGNES: { titre: string; valeur: (c: Compteurs) => string; aide?: string }[] = [
  { titre: "Visites", valeur: (c) => String(c.visites), aide: "Une par visiteur et par session" },
  { titre: "dont via Google Ads", valeur: (c) => String(c.visitesAds) },
  { titre: "Formulaires commencés", valeur: (c) => String(c.formulaires) },
  { titre: "Demandes envoyées", valeur: (c) => String(c.demandes) },
  { titre: "dont urgentes", valeur: (c) => String(c.demandesUrgentes), aide: "Compromis signé ou dépôt sous un mois" },
  { titre: "Clics « Appeler »", valeur: (c) => String(c.appels) },
  { titre: "WhatsApp ouvert", valeur: (c) => String(c.whatsapp), aide: "Message pré-rempli ouvert, pas forcément envoyé : non compté dans les contacts" },
  { titre: "Taux de contact", valeur: taux, aide: "Demandes + appels, rapportés aux visites" },
];

function libelleJour(jour: string) {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function jourCourt(jour: string) {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "short" });
}

/** Cartouche de plan, comme sur le tableau de bord : ce qui est compté, et depuis quand. */
function Cartouche({ depuis }: { depuis: string }) {
  const lignes: [string, string][] = [
    ["Formule", `${express.nom} · ${express.prixTTC} €`],
    ["Annonces", "Google Ads"],
    ["Compté depuis", depuis],
  ];
  return (
    <table className="w-full border border-ink/15 bg-paper text-sm sm:w-auto">
      <tbody>
        {lignes.map(([cle, valeur]) => (
          <tr key={cle} className="border-b border-ink/10 last:border-b-0">
            <th scope="row" className="py-1.5 pr-6 pl-3 text-left font-normal text-ink-3">{cle}</th>
            <td className="py-1.5 pr-3 text-right tabular-nums">{valeur}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Chiffre({ label, valeur, sous }: { label: string; valeur: number | string; sous?: string }) {
  return (
    <div className="flex flex-col bg-paper p-4 sm:p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="display mt-4 text-5xl leading-none lining-nums tabular-nums">{valeur}</p>
      {sous && <p className="mt-auto pt-3 text-xs text-ink-3">{sous}</p>}
    </div>
  );
}

/**
 * Le graphique principal : les visites de chaque jour sur 14 jours, et dans
 * chaque barre la part qui a pris contact (demande ou appel), en vert.
 */
function Graphique({ jours }: { jours: { jour: string; compteurs: Compteurs }[] }) {
  const serie = [...jours].reverse(); // du plus ancien au plus récent
  const max = Math.max(1, ...serie.map(({ compteurs: c }) => Math.max(c.visites, contacts(c))));
  const resume = serie.map(({ jour, compteurs: c }) => `${jourCourt(jour)} : ${c.visites} visites, ${contacts(c)} contacts`).join(" ; ");
  return (
    <div className="border border-stone-2 bg-paper p-4 sm:p-6">
      <div role="img" aria-label={`Visites et contacts par jour sur 14 jours. ${resume}.`}>
        <div className="relative flex h-40 items-end gap-1 border-b border-ink/15 sm:gap-2">
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-ink/10" />
          {serie.map(({ jour, compteurs: c }) => {
            const n = contacts(c);
            const haut = Math.max(c.visites, n);
            return (
              <span key={jour} className="flex h-full flex-1 flex-col justify-end">
                {haut > 0 && <span className="mb-1 text-center text-xs tabular-nums text-ink-2">{c.visites}</span>}
                <span className="flex flex-col justify-end bg-ink/15" style={{ height: haut === 0 ? "2px" : `${(haut / max) * 80}%` }}>
                  {n > 0 && <span className="block bg-forest" style={{ height: `${(n / haut) * 100}%` }} />}
                </span>
              </span>
            );
          })}
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-1 text-center text-xs tabular-nums text-ink-3 sm:gap-2">
          {serie.map(({ jour }, i) => (
            <span key={jour} className={`flex-1 ${i === serie.length - 1 ? "text-ink" : ""}`}>{Number(jour.slice(8))}</span>
          ))}
        </div>
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <span className="flex items-center gap-2"><span className="size-2.5 bg-ink/15" aria-hidden="true" />Visites</span>
        <span className="flex items-center gap-2"><span className="size-2.5 bg-forest" aria-hidden="true" />dont contacts (demandes et appels)</span>
      </p>
    </div>
  );
}

/** Répartition des visites par temps passé, avec la part venue des annonces. */
function TempsPasse({ tous, ads }: { tous: Compteurs; ads: Compteurs }) {
  const total = TRANCHES_TEMPS.reduce((n, [t]) => n + tous.temps[t], 0);
  if (total === 0) {
    return <p className="mt-3 border border-stone-2 bg-paper p-4 text-sm text-ink-2">Aucune visite mesurée pour l&apos;instant</p>;
  }
  return (
    <ul className="mt-3 border border-stone-2 bg-paper text-sm">
      {TRANCHES_TEMPS.map(([t, , libelle]) => {
        const n = tous.temps[t];
        const part = Math.round((n / total) * 100);
        return (
          <li key={t} className="grid grid-cols-[7rem_1fr_6.5rem] items-center gap-3 border-b border-stone-2 px-3 py-2.5 last:border-b-0 sm:grid-cols-[9rem_1fr_7rem] sm:px-4">
            <span>{libelle}</span>
            <span className="h-1.5 bg-stone-2" aria-hidden="true">
              <span className="block h-full bg-forest" style={{ width: `${part}%` }} />
            </span>
            <span className="text-right tabular-nums">
              {n} <span className="text-ink-3">· {part} %</span>
              {ads.temps[t] > 0 && <span className="block text-xs text-ink-3">dont {ads.temps[t]} Ads</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CompteurExpress() {
  if (!suiviConfigure()) {
    return (
      <AdminShell>
        <h1 className="display mb-4 text-4xl sm:text-5xl">Page Express</h1>
        <div className="border border-alert/40 bg-paper p-4 text-sm text-alert">
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
  const debutMois = joursAvant(aujourdhui, 29);
  const moisAds = compter(evenements.filter((e) => e.source === "ads"), debutMois);
  const analyse = analyser(evenements.flatMap((e) => (e.bilan && e.jour >= debutMois ? [e.bilan] : [])));
  const suites = analyserSuites(evenements.flatMap((e) => (e.suite && e.jour >= debutMois ? [e.suite] : [])));
  const jours = parJour(evenements, aujourdhui, 14);
  const depuis =
    zero > 0
      ? new Date(zero).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
      : "le lancement";
  const whatsapp = mois.whatsapp ? ` · ${mois.whatsapp} WhatsApp ouvert${mois.whatsapp > 1 ? "s" : ""}, non compté${mois.whatsapp > 1 ? "s" : ""}` : "";

  return (
    <AdminShell>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-4xl sm:text-5xl">Page Express</h1>
          <a href="/permis-express" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-ink-2 transition-colors hover:text-ink">
            Voir la page ↗
          </a>
        </div>
        <Cartouche depuis={depuis} />
      </header>

      <p className="mt-6 border border-stone-2 bg-paper p-3 text-sm text-ink-2">
        Depuis le 6 novembre 2026, les vues, les bilans de visite et la suite du parcours sont comptés dans Umami
        (événements « express_vue », « express_bilan », « express_suite ») et non plus ici : chaque visite coûtait deux
        opérations du stockage Vercel Blob (2 000 par mois sur le plan gratuit). Formulaires, appels, WhatsApp et
        demandes restent comptés ci-dessous.
      </p>

      {tronque && (
        <p className="mt-6 border border-alert/40 bg-paper p-3 text-sm text-alert">
          Plus de 20 000 événements : les plus récents peuvent manquer
        </p>
      )}

      <h2 className={titreSection}>30 derniers jours</h2>
      <div className="mt-3 grid grid-cols-2 gap-px border border-stone-2 bg-stone-2 lg:grid-cols-4">
        <Chiffre label="Visites" valeur={mois.visites} sous={`${mois.visitesAds} via Google Ads`} />
        <Chiffre label="Contacts" valeur={contacts(mois)} sous={`${mois.demandes} demandes · ${mois.appels} appels${whatsapp}`} />
        <Chiffre label="Demandes urgentes" valeur={mois.demandesUrgentes} sous="À rappeler en premier" />
        <Chiffre label="Taux de contact" valeur={taux(mois)} sous="Contacts rapportés aux visites" />
      </div>

      <h2 className={titreSection}>14 derniers jours</h2>
      <div className="mt-3">
        <Graphique jours={jours} />
      </div>

      <h2 className={titreSection}>Temps passé sur la page, 30 jours</h2>
      <TempsPasse tous={mois} ads={moisAds} />
      <p className="mt-2 text-xs text-ink-3">
        Temps où la page était à l&apos;écran, mesuré au premier départ du visiteur (fermeture, autre appli, appel)
      </p>

      <AnalyseExpress a={analyse} s={suites} />

      <h2 className={titreSection}>Par période</h2>
      {/* Titres courts et explications masquées sur téléphone : le tableau tient dans l'écran. */}
      <table className="mt-3 w-full border-collapse border border-stone-2 bg-paper text-sm">
        <thead>
          <tr className={entete}>
            <th className="p-2 font-normal sm:p-3">
              <span className="sr-only sm:not-sr-only">Indicateur</span>
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
          {LIGNES.map((l) => (
            <tr key={l.titre} className="border-b border-stone-2 last:border-b-0">
              <td className="p-2 sm:p-3">
                <span className={l.titre.startsWith("dont") ? "pl-3 text-ink-2 sm:pl-4" : ""}>{l.titre}</span>
                {l.aide && <span className="hidden text-xs text-ink-3 sm:block">{l.aide}</span>}
              </td>
              {periodes.map(([p, , c]) => (
                <td key={p} className="p-2 text-right whitespace-nowrap tabular-nums sm:p-3">{l.valeur(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={titreSection}>Jour par jour, 14 jours</h2>
      {/* Téléphone : une ligne par jour, visites à gauche, contacts à droite. */}
      <ul className="mt-3 border border-stone-2 bg-paper text-sm sm:hidden">
        {jours.map(({ jour, compteurs: c }) => {
          const vide = c.visites === 0 && contacts(c) === 0 && c.whatsapp === 0;
          const detail = [
            c.demandes > 0 && `${c.demandes} demande${c.demandes > 1 ? "s" : ""}`,
            c.appels > 0 && `${c.appels} appel${c.appels > 1 ? "s" : ""}`,
            c.whatsapp > 0 && `${c.whatsapp} WhatsApp ouvert${c.whatsapp > 1 ? "s" : ""}`,
          ].filter(Boolean);
          return (
            <li key={jour} className={`flex items-baseline justify-between gap-3 border-b border-stone-2 px-3 py-2.5 last:border-b-0 ${vide ? "text-ink-3" : ""}`}>
              <div>
                <p className="first-letter:uppercase">{libelleJour(jour)}</p>
                {!vide && (
                  <p className="text-xs text-ink-3">
                    {c.visitesAds} via Ads · {c.formulaires} formulaire{c.formulaires > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="tabular-nums">
                  {c.visites} visite{c.visites > 1 ? "s" : ""}
                </p>
                {detail.length > 0 && <p className="text-xs text-forest">{detail.join(" · ")}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 hidden sm:block">
        <table className="w-full border-collapse border border-stone-2 bg-paper text-sm">
          <thead>
            <tr className={entete}>
              {["Jour", "Visites", "dont Ads", "Formulaires", "Demandes", "Appels", "WhatsApp ouvert"].map((h) => (
                <th key={h} className="p-3 text-right font-normal first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jours.map(({ jour, compteurs: c }) => (
              <tr key={jour} className={`border-b border-stone-2 last:border-b-0 ${c.visites === 0 && contacts(c) === 0 && c.whatsapp === 0 ? "text-ink-3" : ""}`}>
                <td className="p-3 first-letter:uppercase">{libelleJour(jour)}</td>
                {[c.visites, c.visitesAds, c.formulaires, c.demandes, c.appels, c.whatsapp].map((v, i) => (
                  <td key={i} className={`p-3 text-right tabular-nums ${v === 0 ? "text-ink-3" : ""}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-3">
        Un clic sur « Appeler » n&apos;est pas forcément un appel abouti : comparez avec votre journal d&apos;appels.
        « WhatsApp ouvert » veut dire que le message pré-rempli s&apos;est ouvert, pas qu&apos;il a été envoyé. Les robots (dont celui de Google qui vérifie les annonces) ne sont pas comptés. Aucune donnée
        personnelle n&apos;est enregistrée ici ; le détail de chaque demande arrive par e-mail.
      </p>

      <div className="mt-10 border-t border-ink/10 pt-6">
        <RemiseAZero />
      </div>
    </AdminShell>
  );
}
