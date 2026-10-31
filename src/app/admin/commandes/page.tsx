import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { formulesCommande } from "@/lib/commande";
import { jourParis, joursAvant } from "@/lib/suivi";
import {
  compterCommande,
  ETAPES_ANNEXES,
  ETAPES_TUNNEL,
  parJourCommande,
  repartition,
  tauxConversion,
  type CompteursCommande,
  type EtapeCommande,
  type EvenementCommande,
} from "@/lib/suiviCommande";
import { lireEvenementsCommande } from "@/lib/suiviCommandeStore";
import { suiviConfigure } from "@/lib/suiviStore";

/** Toujours à jour : les chiffres sont relus à chaque ouverture de la page. */
export const dynamic = "force-dynamic";

export const metadata = { title: "Compteur Commandes", robots: { index: false, follow: false } };

const titre = "text-sm font-bold uppercase tracking-[0.18em] text-ink-2";
const nomFormule = (id: string) => formulesCommande.find((f) => f.id === id)?.name ?? id;
const pourcent = (n: number, sur: number) => (sur ? Math.round((n / sur) * 100) : 0);

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

/** Entonnoir : chaque étape rapportée aux paniers ouverts, et la perte depuis l'étape précédente. */
function Entonnoir({ c }: { c: CompteursCommande }) {
  const base = c.etapes.panier;
  if (base === 0) return <p className="mt-3 bg-paper p-4 text-sm text-ink-2">Aucun panier ouvert pour l&apos;instant.</p>;
  return (
    <ul className="mt-3 bg-paper text-sm">
      {ETAPES_TUNNEL.map(([etape, libelle], i) => {
        const n = c.etapes[etape];
        const precedent = i > 0 ? c.etapes[ETAPES_TUNNEL[i - 1][0]] : n;
        const perte = precedent - n;
        return (
          <li key={etape} className="grid grid-cols-[1fr_5.5rem] items-center gap-x-3 gap-y-1.5 border-b border-stone-2 px-3 py-3 sm:grid-cols-[13rem_1fr_7rem] sm:px-4">
            <span className="font-bold">{libelle}</span>
            <span className="order-last col-span-2 h-2 bg-stone-2 sm:order-none sm:col-span-1" aria-hidden="true">
              <span className="block h-full bg-forest" style={{ width: `${pourcent(n, base)}%` }} />
            </span>
            <span className="text-right tabular-nums">
              {n} <span className="text-ink-2">· {pourcent(n, base)} %</span>
              {i > 0 && perte > 0 && <span className="block text-xs text-alert">− {perte} depuis l&apos;étape d&apos;avant</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Répartition par formule ou par paiement, pour les devis affichés et les commandes signées. */
function Repartition({ evenements, cle, libelle }: { evenements: EvenementCommande[]; cle: "formule" | "echeances"; libelle: (v: string) => string }) {
  const devis = repartition(evenements, "devis", cle);
  const signees = new Map(repartition(evenements, "signee", cle));
  if (devis.length === 0) return <p className="mt-3 bg-paper p-4 text-sm text-ink-2">Aucun devis affiché pour l&apos;instant.</p>;
  return (
    <table className="mt-3 w-full border-collapse bg-paper text-sm">
      <thead>
        <tr className="border-b border-ink text-left">
          <th className="p-2 font-bold sm:p-3">{cle === "formule" ? "Formule" : "Paiement"}</th>
          <th className="p-2 text-right font-bold sm:p-3">Devis</th>
          <th className="p-2 text-right font-bold sm:p-3">Signées</th>
        </tr>
      </thead>
      <tbody>
        {devis.map(([v, n]) => (
          <tr key={v} className="border-b border-stone-2">
            <td className="p-2 sm:p-3">{libelle(v)}</td>
            <td className="p-2 text-right tabular-nums sm:p-3">{n}</td>
            <td className="p-2 text-right tabular-nums sm:p-3">{signees.get(v) ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const COLONNES_JOUR: [EtapeCommande, string][] = [
  ["panier", "Paniers"],
  ["formulaire", "Formulaires"],
  ["devis", "Devis"],
  ["accepte", "Acceptés"],
  ["signee", "Signées"],
  ["plus-tard", "Plus tard"],
];

export default async function CompteurCommandes() {
  if (!suiviConfigure()) {
    return (
      <AdminShell>
        <h1 className="display text-3xl mb-4">Compteur des commandes en ligne</h1>
        <div className="border border-alert/40 bg-alert/5 p-4 text-sm text-alert">
          Le stockage Vercel Blob n&apos;est pas relié au projet (<code>BLOB_READ_WRITE_TOKEN</code> absent) : aucun
          événement n&apos;est enregistré.
        </div>
      </AdminShell>
    );
  }

  const { evenements, tronque } = await lireEvenementsCommande();
  const aujourdhui = jourParis(new Date());
  const debutMois = joursAvant(aujourdhui, 29);
  const evenementsMois = evenements.filter((e) => e.jour >= debutMois);
  const mois = compterCommande(evenementsMois);
  const taux = tauxConversion(mois);
  const periodes: [string, string, CompteursCommande][] = [
    ["Aujourd'hui", "Auj.", compterCommande(evenements, aujourdhui)],
    ["7 jours", "7 j", compterCommande(evenements, joursAvant(aujourdhui, 6))],
    ["30 jours", "30 j", mois],
    ["Depuis le lancement", "Total", compterCommande(evenements)],
  ];
  const jours = parJourCommande(evenements, aujourdhui, 14);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-2xl sm:text-3xl">Compteur des commandes en ligne</h1>
          <p className="mt-1 text-sm text-ink-2">Tunnel /commander : panier, formulaire, devis, IBAN · chiffres à l&apos;heure de Paris</p>
        </div>
        <Link href="/commander" target="_blank" className="btn btn-line text-sm !min-h-10">
          Voir le tunnel
        </Link>
      </div>

      {tronque && (
        <p className="mt-6 border border-alert/40 bg-alert/5 p-3 text-sm text-alert">Plus de 20 000 événements : les plus récents peuvent manquer.</p>
      )}

      <h2 className={`mt-8 sm:mt-10 ${titre}`}>30 derniers jours</h2>
      <div className="mt-3 grid gap-px bg-stone-2 grid-cols-2 lg:grid-cols-4">
        <Chiffre label="Paniers ouverts" valeur={mois.etapes.panier} sous={`${mois.ads.panier} via Google Ads`} />
        <Chiffre label="Devis affichés" valeur={mois.etapes.devis} sous={`${mois.etapes.accepte} acceptés`} />
        <Chiffre label="Commandes signées" valeur={mois.etapes.signee} sous={`${mois.etapes["plus-tard"]} « terminer plus tard »`} />
        <Chiffre label="Taux de conversion" valeur={taux === null ? "—" : `${taux} %`} sous="Commandes signées / paniers" />
      </div>

      <h2 className={`mt-10 sm:mt-12 ${titre}`}>Entonnoir (30 jours)</h2>
      <Entonnoir c={mois} />
      {mois.etapes.erreur > 0 && (
        <p className="mt-3 border border-alert/40 bg-alert/5 p-3 text-sm text-alert">
          {mois.etapes.erreur} erreur{mois.etapes.erreur > 1 ? "s" : ""} à la création du devis : vérifiez la connexion Qonto dans le tableau de bord.
        </p>
      )}

      <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2">
        <section>
          <h2 className={titre}>Par formule (30 jours)</h2>
          <Repartition evenements={evenementsMois} cle="formule" libelle={nomFormule} />
        </section>
        <section>
          <h2 className={titre}>Par paiement (30 jours)</h2>
          <Repartition evenements={evenementsMois} cle="echeances" libelle={(v) => (v === "1" ? "En 1 fois" : `En ${v} fois`)} />
        </section>
      </div>

      <h2 className={`mt-10 sm:mt-12 ${titre}`}>Par période</h2>
      <table className="mt-3 w-full border-collapse bg-paper text-sm">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="p-2 font-bold sm:p-3">
              <span className="sr-only sm:not-sr-only">Étape</span>
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
          {[...ETAPES_TUNNEL, ...ETAPES_ANNEXES].map(([etape, libelle]) => (
            <tr key={etape} className="border-b border-stone-2">
              <td className="p-2 sm:p-3">{libelle}</td>
              {periodes.map(([p, , c]) => (
                <td key={p} className="p-2 text-right tabular-nums sm:p-3">{c.etapes[etape]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={`mt-10 sm:mt-12 ${titre}`}>Jour par jour (14 jours)</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse bg-paper text-sm">
          <thead>
            <tr className="border-b border-ink">
              <th className="p-2 text-left font-bold sm:p-3">Jour</th>
              {COLONNES_JOUR.map(([, h]) => (
                <th key={h} className="p-2 text-right font-bold sm:p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jours.map(({ jour, compteurs: c }) => (
              <tr key={jour} className={`border-b border-stone-2 ${c.etapes.panier === 0 && c.etapes.devis === 0 ? "text-ink-3" : ""}`}>
                <td className="p-2 sm:p-3">{libelleJour(jour)}</td>
                {COLONNES_JOUR.map(([etape]) => (
                  <td key={etape} className={`p-2 text-right tabular-nums sm:p-3 ${etape === "signee" && c.etapes.signee > 0 ? "font-bold text-forest" : ""}`}>
                    {c.etapes[etape]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-2">
        Chaque étape est comptée une fois par visite : revenir en arrière ou recharger ne recompte pas. Devis, acceptation,
        signature et erreurs sont comptés par le serveur, au moment où ils ont réellement lieu. Vos propres passages (cet
        appareil) et les robots ne comptent pas. Aucune donnée personnelle n&apos;est enregistrée ici ; le détail de chaque
        commande arrive par e-mail. Le compteur démarre à la mise en ligne de cette page.
      </p>
    </AdminShell>
  );
}
