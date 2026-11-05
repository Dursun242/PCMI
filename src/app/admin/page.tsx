import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { isGithubConfigured } from "@/lib/adminContent";
import { githubConfigure } from "@/lib/plancheGithub";
import { listerPlanches, type EntreePlanche } from "@/lib/plancheStore";
import { etatConnexion } from "@/lib/qontoConnexion";
import { jourParis, joursAvant, type Evenement } from "@/lib/suivi";
import type { EvenementCommande } from "@/lib/suiviCommande";
import { lireEvenementsCommande } from "@/lib/suiviCommandeStore";
import { lireEvenements, suiviConfigure } from "@/lib/suiviStore";
import { evolution, indicateur, type Indicateur } from "@/lib/tableauDeBord";

// Chiffres et état des services relus à chaque visite.
export const dynamic = "force-dynamic";

const MESSAGES_QONTO: Record<string, string> = {
  connecte: "Qonto est connecté : la commande en ligne peut créer les mandats SEPA.",
  refuse: "Autorisation refusée chez Qonto : rien n'a changé.",
  erreur: "La connexion à Qonto a échoué. Réessayez ; si cela persiste, vérifiez l'adresse de retour déclarée dans l'application Qonto.",
  "non-configure": "QONTO_CLIENT_ID et QONTO_CLIENT_SECRET ne sont pas renseignées dans Vercel.",
};

const CONNEXION_QONTO = "/api/admin/qonto/connexion";
const CONTACTS_EXPRESS = new Set<Evenement["type"]>(["demande", "demande-urgente", "appel"]);
const titreSection = "text-sm text-ink-2";

/** Une source de chiffres peut manquer (stockage absent, erreur passagère) : le tableau de bord s'affiche quand même. */
async function sansErreur<T>(lecture: () => Promise<T>): Promise<T | null> {
  try {
    return await lecture();
  } catch (err) {
    console.error("[admin] tableau de bord : lecture impossible", err);
    return null;
  }
}

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

/** « 30 oct. » pour un jour AAAA-MM-JJ. */
function jourCourt(jour: string) {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "short" });
}

/** Cartouche de plan, comme sur les planches : la date et les deux périodes comparées. */
function Cartouche({ aujourdhui, dateLongue }: { aujourdhui: string; dateLongue: string }) {
  const lignes: [string, string][] = [
    ["Date", dateLongue],
    ["Cette semaine", `${jourCourt(joursAvant(aujourdhui, 6))} – ${jourCourt(aujourdhui)}`],
    ["Comparée à", `${jourCourt(joursAvant(aujourdhui, 13))} – ${jourCourt(joursAvant(aujourdhui, 7))}`],
  ];
  return (
    <table className="w-full border border-ink/15 bg-paper text-sm sm:w-auto">
      <tbody>
        {lignes.map(([cle, valeur]) => (
          <tr key={cle} className="border-b border-ink/10 last:border-b-0">
            <th scope="row" className="py-1.5 pr-6 pl-3 text-left font-normal text-ink-3">{cle}</th>
            <td className="py-1.5 pr-3 text-right tabular-nums first-letter:uppercase">{valeur}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type TuileProps = { href: string; libelle: string; valeur: Indicateur | null; detail: string };

function Tuile({ href, libelle, valeur, detail }: TuileProps) {
  const ev = valeur ? evolution(valeur) : null;
  const couleur = ev?.sens === "hausse" ? "text-forest" : ev?.sens === "baisse" ? "text-alert" : "text-ink-2";
  const fleche = ev?.sens === "hausse" ? "↗" : ev?.sens === "baisse" ? "↘" : "→";
  return (
    <Link href={href} className="group flex h-full flex-col bg-paper p-4 transition-colors hover:bg-white sm:p-5">
      <span className="flex items-center justify-between gap-2 text-sm text-ink-2">
        {libelle}
        <span aria-hidden="true" className="text-ink-3 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-bronze">→</span>
      </span>
      <span className="display mt-4 text-5xl leading-none lining-nums tabular-nums">{valeur ? valeur.semaine : "—"}</span>
      <span className={`mt-2 text-sm ${couleur}`}>{ev ? `${fleche} ${ev.texte}` : "Compteur non relié"}</span>
      <span className="mt-auto pt-4 text-xs text-ink-3">{valeur ? `${detail} · aujourd'hui ${valeur.aujourdhui}` : detail}</span>
    </Link>
  );
}

/**
 * Le graphique principal : les contacts reçus chaque jour sur 14 jours, toutes
 * sources additionnées. La semaine en cours en vert, celle d'avant en clair.
 */
function Graphique({ serie, aujourdhui }: { serie: number[]; aujourdhui: string }) {
  const max = Math.max(1, ...serie);
  const semaine = serie.slice(7).reduce((a, b) => a + b, 0);
  const avant = serie.slice(0, 7).reduce((a, b) => a + b, 0);
  const jours = serie.map((_, i) => joursAvant(aujourdhui, serie.length - 1 - i));
  const resume = jours.map((j, i) => `${jourCourt(j)} : ${serie[i]}`).join(", ");
  return (
    <div className="border border-stone-2 bg-paper p-4 sm:p-6">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="display text-3xl leading-none lining-nums tabular-nums">{semaine}</span>
        <span className="text-sm text-ink-2">cette semaine, contre {avant} la semaine d&apos;avant</span>
      </p>
      <div role="img" aria-label={`Contacts reçus par jour sur 14 jours. ${resume}.`} className="mt-6">
        <div className="relative flex h-36 items-end gap-1 border-b border-ink/15 sm:gap-2">
          {/* Lignes de repère : la moitié et le maximum. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-ink/10" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-ink/10" />
          {serie.map((n, i) => (
            <span key={jours[i]} className="relative flex h-full flex-1 flex-col justify-end">
              {n > 0 && <span className="mb-1 text-center text-xs tabular-nums text-ink-2">{n}</span>}
              <span
                className={`block ${i >= 7 ? "bg-forest" : "bg-stone-2"}`}
                style={{ height: n === 0 ? "2px" : `${(n / max) * 80}%` }}
              />
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-1 text-center text-xs tabular-nums text-ink-3 sm:gap-2">
          {jours.map((j, i) => (
            <span key={j} className={`flex-1 ${i === jours.length - 1 ? "text-ink" : ""}`}>{Number(j.slice(8))}</span>
          ))}
        </div>
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <span className="flex items-center gap-2"><span className="size-2.5 bg-forest" aria-hidden="true" />Cette semaine</span>
        <span className="flex items-center gap-2"><span className="size-2.5 bg-stone-2" aria-hidden="true" />Semaine d&apos;avant</span>
        <span className="text-ink-3">Commandes signées, demandes et appels Express, plans gratuits</span>
      </p>
    </div>
  );
}

type Niveau = "ok" | "alerte" | "inactif";

function Pastille({ niveau }: { niveau: Niveau }) {
  const couleur = niveau === "ok" ? "bg-forest" : niveau === "alerte" ? "bg-alert" : "bg-ink-3";
  return <span className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${couleur}`} aria-hidden="true" />;
}

type Service = { nom: string; niveau: Niveau; etat: string };
type ATraiter = { texte: string; href: string; action: string };

function BlocATraiter({ items, servicesOk }: { items: ATraiter[]; servicesOk: boolean }) {
  if (items.length === 0) {
    const suite = servicesOk ? "Les services tournent normalement" : "Un réglage manque, voir l'état des services";
    return (
      <p className="flex items-start gap-3 border border-stone-2 bg-paper px-4 py-3 text-sm">
        <Pastille niveau={servicesOk ? "ok" : "alerte"} />
        <span>Rien à traiter <span className="text-ink-2">· {suite}</span></span>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-alert/20 border border-alert/30 bg-paper">
      {items.map((a) => (
        <li key={a.texte} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <span className="flex items-start gap-3">
            <Pastille niveau="alerte" />
            <span className="text-alert">{a.texte}</span>
          </span>
          {/* Lien classique : la connexion Qonto sort du site. */}
          <a href={a.href} className="btn btn-ink shrink-0 text-sm !min-h-9 !px-4">{a.action}</a>
        </li>
      ))}
    </ul>
  );
}

/** Additionne des séries de même longueur ; les séries absentes (compteur non relié) sont ignorées. */
function additionner(series: (number[] | undefined)[]): number[] | null {
  const presentes = series.filter((s): s is number[] => Boolean(s));
  if (presentes.length === 0) return null;
  return presentes[0].map((_, i) => presentes.reduce((total, s) => total + s[i], 0));
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ qonto?: string }> }) {
  const compteurs = suiviConfigure();
  const [{ qonto: retourQonto }, qonto, commandes, express, planches] = await Promise.all([
    searchParams,
    etatConnexion(),
    compteurs ? sansErreur(lireEvenementsCommande) : null,
    compteurs ? sansErreur(lireEvenements) : null,
    sansErreur(() => listerPlanches()),
  ]);
  const messageQonto = retourQonto ? MESSAGES_QONTO[retourQonto] : undefined;

  const maintenant = new Date();
  const aujourdhui = jourParis(maintenant);
  const dateLongue = maintenant.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });

  const jours = (etape: EvenementCommande["etape"]) => (commandes?.evenements ?? []).filter((e) => e.etape === etape).map((e) => e.jour);
  const signees = commandes ? indicateur(jours("signee"), aujourdhui) : null;
  const paniers = commandes ? indicateur(jours("panier"), aujourdhui) : null;
  const erreursDevis = commandes ? indicateur(jours("erreur"), aujourdhui).semaine : 0;
  const contacts = express
    ? indicateur(express.evenements.filter((e) => CONTACTS_EXPRESS.has(e.type)).map((e) => e.jour), aujourdhui)
    : null;
  const entreesPlanches: EntreePlanche[] = planches ?? [];
  const demandesPlanches = planches ? indicateur(entreesPlanches.map((e) => jourParis(new Date(e.cree))), aujourdhui) : null;
  const planchesEnEchec = entreesPlanches.filter((e) => e.statut === "echec").length;

  const contenuEnregistre = isGithubConfigured();
  const dessinAuto = githubConfigure();
  const aTraiter: ATraiter[] = [
    ...(planchesEnEchec > 0
      ? [{ texte: `${pluriel(planchesEnEchec, "planche gratuite")} à préparer à la main`, href: "/admin/planches", action: "Voir" }]
      : []),
    ...(qonto.configuree && !qonto.connectee
      ? [{ texte: "Qonto est déconnecté : la commande en ligne ne peut pas créer de mandat SEPA", href: CONNEXION_QONTO, action: "Connecter" }]
      : []),
    ...(erreursDevis > 0
      ? [{ texte: `${pluriel(erreursDevis, "erreur")} à la création du devis cette semaine`, href: "/admin/commandes", action: "Voir" }]
      : []),
  ];

  const services: Service[] = [
    {
      nom: "Qonto (commande en ligne)",
      niveau: !qonto.configuree ? "inactif" : qonto.connectee ? "ok" : "alerte",
      etat: !qonto.configuree ? "Application non renseignée" : qonto.connectee ? "Connecté, renouvelé automatiquement" : "Déconnecté",
    },
    {
      nom: "Enregistrement du contenu",
      niveau: contenuEnregistre ? "ok" : "alerte",
      etat: contenuEnregistre ? "Articles et chiffres enregistrés sur GitHub" : "ADMIN_GITHUB_TOKEN absent : rien n'est conservé",
    },
    {
      nom: "Compteurs et registre",
      niveau: compteurs ? "ok" : "alerte",
      etat: compteurs ? "Stockage Vercel Blob relié" : "BLOB_READ_WRITE_TOKEN absent : rien n'est compté",
    },
    {
      nom: "Dessin des planches",
      niveau: dessinAuto ? "ok" : "alerte",
      etat: dessinAuto ? "Automatique (outil id-plans)" : "IDPLANS_GITHUB_TOKEN absent : à faire à la main",
    },
  ];

  const contactsParJour = additionner([signees?.serie, contacts?.serie, demandesPlanches?.serie]);

  return (
    <AdminShell>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="display text-4xl sm:text-5xl">Tableau de bord</h1>
        <Cartouche aujourdhui={aujourdhui} dateLongue={dateLongue} />
      </header>

      {messageQonto && (
        <p role="status" className="mt-6 border-l-2 border-brass bg-paper p-4 text-sm">{messageQonto}</p>
      )}

      <section aria-labelledby="a-traiter" className="mt-8">
        <h2 id="a-traiter" className="sr-only">À traiter</h2>
        <BlocATraiter items={aTraiter} servicesOk={services.every((s) => s.niveau !== "alerte")} />
      </section>

      <section aria-labelledby="chiffres" className="mt-10">
        <h2 id="chiffres" className={titreSection}>Cette semaine</h2>
        <div className="mt-3 grid grid-cols-2 gap-px border border-stone-2 bg-stone-2 lg:grid-cols-4">
          <Tuile href="/admin/commandes" libelle="Commandes" valeur={signees} detail="Mandats signés" />
          <Tuile href="/admin/commandes" libelle="Paniers" valeur={paniers} detail="Paniers ouverts" />
          <Tuile href="/admin/express" libelle="Express" valeur={contacts} detail="Demandes et appels" />
          <Tuile href="/admin/planches" libelle="Plans gratuits" valeur={demandesPlanches} detail="Demandes reçues" />
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="quatorze-jours">
          <h2 id="quatorze-jours" className={titreSection}>Contacts reçus, 14 derniers jours</h2>
          <div className="mt-3">
            {contactsParJour ? (
              <Graphique serie={contactsParJour} aujourdhui={aujourdhui} />
            ) : (
              <p className="border border-stone-2 bg-paper p-6 text-sm text-ink-2">Compteurs non reliés : pas de graphique</p>
            )}
          </div>
        </section>

        <section aria-labelledby="services">
          <h2 id="services" className={titreSection}>État des services</h2>
          <ul className="mt-3 divide-y divide-stone-2 border border-stone-2 bg-paper">
            {services.map((s) => (
              <li key={s.nom} className="flex gap-3 px-4 py-3 text-sm">
                <Pastille niveau={s.niveau} />
                <span>
                  <span className="block text-ink">{s.nom}</span>
                  <span className={s.niveau === "alerte" ? "text-alert" : "text-ink-2"}>{s.etat}</span>
                </span>
              </li>
            ))}
          </ul>
          {qonto.configuree && (
            // Lien classique (pas de Link) : la route renvoie vers Qonto, hors du site.
            <a href={CONNEXION_QONTO} className="btn btn-line mt-3 w-full text-sm !min-h-10">
              {qonto.connectee ? "Reconnecter Qonto" : "Connecter Qonto"}
            </a>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
