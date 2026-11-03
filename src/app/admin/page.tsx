import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { UMAMI } from "@/components/admin/liens";
import { isGithubConfigured } from "@/lib/adminContent";
import { githubConfigure } from "@/lib/plancheGithub";
import { listerPlanches, type EntreePlanche } from "@/lib/plancheStore";
import { etatConnexion } from "@/lib/qontoConnexion";
import { jourParis, type Evenement } from "@/lib/suivi";
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
const surtitre = "text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ink-2";

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

/** Les 14 derniers jours en barres : la semaine d'avant en clair, la semaine en cours en vert. */
function Courbe({ serie }: { serie: number[] }) {
  const max = Math.max(1, ...serie);
  const largeur = 6;
  const pas = 9;
  const hauteur = 30;
  return (
    <svg viewBox={`0 0 ${serie.length * pas - (pas - largeur)} ${hauteur}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      {serie.map((n, i) => {
        const h = n === 0 ? 1.5 : Math.max(3, (n / max) * hauteur);
        return (
          <rect
            key={i}
            x={i * pas}
            y={hauteur - h}
            width={largeur}
            height={h}
            rx={1}
            className={i >= serie.length - 7 ? "fill-forest" : "fill-stone-2"}
          />
        );
      })}
    </svg>
  );
}

type TuileProps = { href: string; libelle: string; valeur: Indicateur | null; detail: string };

function Tuile({ href, libelle, valeur, detail }: TuileProps) {
  const ev = valeur ? evolution(valeur) : null;
  const couleur = ev?.sens === "hausse" ? "text-forest" : ev?.sens === "baisse" ? "text-alert" : "text-ink-2";
  const fleche = ev?.sens === "hausse" ? "↗" : ev?.sens === "baisse" ? "↘" : "→";
  const pied = valeur ? `${detail} · aujourd'hui ${valeur.aujourdhui}` : detail;
  return (
    <Link href={href} className="group flex flex-col bg-paper p-4 transition-colors hover:bg-white sm:p-5">
      <span className={surtitre}>{libelle}</span>
      <span className="display mt-3 text-5xl leading-none lining-nums tabular-nums">{valeur ? valeur.semaine : "—"}</span>
      <span className={`mt-2 text-xs font-bold ${couleur}`}>{ev ? `${fleche} ${ev.texte}` : "Compteur non relié"}</span>
      <span className="mt-4 block">{valeur && <Courbe serie={valeur.serie} />}</span>
      <span className="mt-3 flex items-center justify-between gap-2 border-t border-stone-2 pt-3 text-xs text-ink-2">
        <span>{pied}</span>
        <span aria-hidden="true" className="text-bronze transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}

type Niveau = "ok" | "alerte" | "inactif";

function Pastille({ niveau }: { niveau: Niveau }) {
  const couleur = niveau === "ok" ? "bg-forest" : niveau === "alerte" ? "bg-alert" : "bg-ink-3";
  return <span className={`mt-1.5 inline-block size-2.5 shrink-0 rounded-full ${couleur}`} aria-hidden="true" />;
}

type Service = { nom: string; niveau: Niveau; etat: string };
type ATraiter = { texte: string; href: string; action: string };
type Raccourci = { href: string; titre: string; texte: string; externe?: boolean };

const RACCOURCIS: Raccourci[] = [
  { href: "/admin/commandes", titre: "Compteur Commandes", texte: "Tunnel /commander : paniers, devis, signatures, par formule." },
  { href: "/admin/express", titre: "Compteur Express", texte: "Visites, demandes, appels et WhatsApp de la campagne Google Ads." },
  { href: "/admin/planches", titre: "Planches gratuites", texte: "Demandes de plans gratuits et leur statut d'envoi." },
  { href: "/admin/articles", titre: "Articles", texte: "Créer, modifier ou supprimer les articles du blog." },
  { href: "/admin/chiffres", titre: "Chiffres clés", texte: "Permis déposés, taux d'accord, note Google de l'accueil." },
  { href: "/admin/realisations", titre: "Réalisations", texte: "La galerie de projets réels de l'accueil." },
  { href: UMAMI, titre: "Statistiques du site", texte: "Parcours des visiteurs sur tout le site (Umami).", externe: true },
];

function CarteRaccourci({ r }: { r: Raccourci }) {
  const classe = "group block h-full bg-paper p-4 transition-colors hover:bg-white sm:p-5";
  const contenu = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="font-bold">{r.titre}</span>
        <span aria-hidden="true" className="text-bronze transition-transform group-hover:translate-x-0.5">{r.externe ? "↗" : "→"}</span>
      </span>
      <span className="mt-1 block text-sm leading-snug text-ink-2">{r.texte}</span>
    </>
  );
  if (r.externe) {
    return <a href={r.href} target="_blank" rel="noopener noreferrer" className={classe}>{contenu}</a>;
  }
  return <Link href={r.href} className={classe}>{contenu}</Link>;
}

function BlocATraiter({ items, servicesOk }: { items: ATraiter[]; servicesOk: boolean }) {
  if (items.length === 0) {
    const suite = servicesOk ? "Les services tournent normalement." : "Un réglage manque : voir l'état des services.";
    return (
      <p className="flex items-center gap-3 bg-paper p-4 text-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest text-paper" aria-hidden="true">✓</span>
        <span><strong>Rien à traiter.</strong> <span className="text-ink-2">{suite}</span></span>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-alert/20 border border-alert/30 bg-alert/5">
      {items.map((a) => (
        <li key={a.texte} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="flex items-start gap-3">
            <Pastille niveau="alerte" />
            <span className="font-bold text-alert">{a.texte}</span>
          </span>
          {/* Lien classique : la connexion Qonto sort du site. */}
          <a href={a.href} className="btn btn-ink shrink-0 text-sm !min-h-9 !px-4">{a.action}</a>
        </li>
      ))}
    </ul>
  );
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

  return (
    <AdminShell>
      <header>
        <p className={`${surtitre} first-letter:uppercase`}>{dateLongue}</p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">Tableau de bord</h1>
        <p className="mt-2 text-sm text-ink-2">Les 7 derniers jours, comparés aux 7 d&apos;avant · heure de Paris.</p>
      </header>

      {messageQonto && (
        <p role="status" className="mt-6 border-l-2 border-brass bg-paper p-4 text-sm font-bold">{messageQonto}</p>
      )}

      <section aria-labelledby="a-traiter" className="mt-8">
        <h2 id="a-traiter" className="sr-only">À traiter</h2>
        <BlocATraiter items={aTraiter} servicesOk={services.every((s) => s.niveau !== "alerte")} />
      </section>

      <section aria-labelledby="chiffres" className="mt-10">
        <h2 id="chiffres" className={surtitre}>Cette semaine</h2>
        <div className="mt-3 grid grid-cols-2 gap-px border border-stone-2 bg-stone-2 lg:grid-cols-4">
          <Tuile href="/admin/commandes" libelle="Commandes" valeur={signees} detail="Mandats signés" />
          <Tuile href="/admin/commandes" libelle="Paniers" valeur={paniers} detail="Paniers ouverts" />
          <Tuile href="/admin/express" libelle="Express" valeur={contacts} detail="Demandes + appels" />
          <Tuile href="/admin/planches" libelle="Plans gratuits" valeur={demandesPlanches} detail="Demandes reçues" />
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="gerer">
          <h2 id="gerer" className={surtitre}>Gérer le site</h2>
          <ul className="mt-3 grid gap-px border border-stone-2 bg-stone-2 sm:grid-cols-2">
            {RACCOURCIS.map((r, i) => (
              // Le dernier raccourci, seul sur sa ligne, prend toute la largeur.
              <li key={r.href} className={i === RACCOURCIS.length - 1 && RACCOURCIS.length % 2 === 1 ? "sm:col-span-2" : undefined}>
                <CarteRaccourci r={r} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="services">
          <h2 id="services" className={surtitre}>État des services</h2>
          <ul className="mt-3 divide-y divide-stone-2 border border-stone-2 bg-paper">
            {services.map((s) => (
              <li key={s.nom} className="flex gap-3 p-4 text-sm">
                <Pastille niveau={s.niveau} />
                <span>
                  <span className="block font-bold">{s.nom}</span>
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
