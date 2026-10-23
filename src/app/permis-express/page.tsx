import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ExpressForm from "@/components/ExpressForm";
import ExpressBarre from "@/components/ExpressBarre";
import TelLink from "@/components/TelLink";
import WhatsAppLink from "@/components/WhatsAppLink";
import { express, site } from "@/config/site";
import { formatEuro, formatFrDate } from "@/lib/format";

/**
 * Page d'atterrissage de la campagne Google Ads « permis express »
 * (Seine-Maritime, Eure, Calvados). Une seule offre, une seule action :
 * appeler ou laisser ses coordonnées. Pas d'indexation : la page sert la
 * publicité et ne doit pas concurrencer les pages du référencement naturel.
 *
 * Contenu commercial (prix, délais, conditions) : `express` dans src/config/site.ts.
 */
export const metadata: Metadata = {
  title: `Permis de construire express, plain-pied dès ${formatEuro(express.prixTTC)}`,
  description: `Maison de plain-pied jusqu'à ${express.surfaceMax} m² en Seine-Maritime, Eure ou Calvados : devis sous 4 h ouvrées, premiers plans sous ${express.premiersPlans}, dossier PCMI prêt en ${express.delai}.`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/permis-express" },
};

const etapes: [string, string, string][] = [
  ["Jour 0", "Devis sous 4 h ouvrées", "Nous lisons le PLU de votre commune et vous rappelons avec un prix fixe."],
  [`Sous ${express.premiersPlans}`, "Premiers plans", "Plan, façades et implantation sur le terrain, à valider ou corriger."],
  [`En ${express.delai}`, "Dossier complet et dépôt", "Pièces PCMI 1 à 8, CERFA, dépôt en ligne sur le guichet de votre mairie."],
];

const faq: [string, string][] = [
  [
    "Mon compromis a une date limite de dépôt. Vous pouvez tenir ?",
    `C'est notre spécialité. Dites-nous la date dès le premier appel : le dossier est prêt en ${express.delai} une fois vos informations réunies, et nous vous remettons le récépissé de dépôt, la preuve à transmettre au notaire.`,
  ],
  [
    "Et si ma maison a un étage ou dépasse " + express.surfaceMax + " m² ?",
    "Nous faisons aussi ces permis, avec une autre formule. Vous le saurez au devis, avant tout engagement, avec un prix fixe.",
  ],
  [
    "Combien de temps la mairie met-elle ensuite ?",
    "Deux mois d'instruction pour une maison individuelle, trois en secteur protégé. Un dossier complet dès le dépôt évite la demande de pièces qui relance ce délai.",
  ],
  [
    "Faut-il se déplacer ?",
    `Non : tout peut se faire par téléphone et e-mail. Si vous préférez en parler de vive voix, le bureau vous reçoit au ${site.address.street}, ${site.address.city}.`,
  ],
  [
    "Que dois-je préparer ?",
    "Le plan du terrain (bornage ou extrait cadastral), votre idée de plan, même griffonnée, ou un plan de constructeur, et deux photos du terrain. Rien n'est nécessaire pour demander le devis.",
  ],
];

export default function PermisExpressPage() {
  if (!express.actif) redirect("/devis");

  return (
    <>
      {/* Hero et formulaire côte à côte sur grand écran : l'action est visible sans défiler. */}
      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-20 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="rule" aria-hidden="true" />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">
                Seine-Maritime · Eure · Calvados
              </span>
            </div>
            <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-[4.25rem] max-w-[16ch]">
              Votre permis de construire de plain-pied, <em>prêt en {express.delai.replace(" ouvrés", "")}.</em>
            </h1>
            <p className="mt-7 text-lg sm:text-xl leading-relaxed text-paper/80 max-w-[48ch]">
              Compromis signé, date butoir, banque qui attend : un maître d&apos;œuvre du Havre monte votre dossier
              et le dépose en ligne, sans vous faire perdre une semaine.
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-px bg-paper/15 max-w-xl">
              {[
                ["Devis", "4 h", "ouvrées"],
                ["Plans", express.premiersPlans, "pour valider"],
                ["Dossier", express.delai.replace(" jours ouvrés", " j"), "ouvrés"],
              ].map(([t, v, s]) => (
                <div key={t} className="bg-forest py-5 pr-4 first:pl-0 pl-4">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brass-2">{t}</dt>
                  <dd className="mt-2">
                    <span className="display text-4xl">{v}</span>
                    <span className="block text-xs text-paper/70">{s}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 border-l-2 border-brass-2 pl-5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">Formule {express.nom}</p>
              <p className="mt-2">
                <span className="display text-5xl">{formatEuro(express.prixTTC)}</span>{" "}
                <span className="text-paper/80">TTC, prix fixe</span>
              </p>
              <p className="mt-2 text-sm text-paper/70 max-w-[46ch]">
                Maison de plain-pied jusqu&apos;à {express.surfaceMax} m², dépôt en ligne inclus. Réservée aux{" "}
                {express.places} premiers dossiers, devis demandé avant le {formatFrDate(express.fin)}.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <TelLink source="express_hero" className="btn btn-paper">
                Appeler le {site.phone}
              </TelLink>
              <WhatsAppLink
                source="express_hero"
                text="Bonjour, j'ai besoin d'un permis de construire rapidement pour une maison de plain-pied."
                className="text-paper underline decoration-brass-2 underline-offset-4"
              >
                Écrire sur WhatsApp
              </WhatsAppLink>
            </div>
          </div>

          <div id="devis" className="scroll-mt-24 bg-paper text-ink px-6 py-8 sm:px-9 sm:py-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">Gratuit · sans engagement</p>
            <h2 className="display mt-3 text-4xl leading-tight">Recevez votre devis sous 4 h ouvrées</h2>
            <p className="mt-3 text-sm text-ink-2">Trois champs obligatoires, une minute. Nous vous rappelons avec un prix fixe.</p>
            <div className="mt-8">
              <ExpressForm />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="deroule">
        <span className="rule" aria-hidden="true" />
        <h2 id="deroule" className="h-section mt-6">Du premier appel au dépôt</h2>
        <ol className="mt-10 grid gap-px bg-stone-2 md:grid-cols-3">
          {etapes.map(([quand, titre, texte], i) => (
            <li key={titre} className="bg-paper p-6 md:p-8">
              <span className="numeral text-3xl text-bronze">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">{quand}</p>
              <p className="display mt-1 text-3xl leading-tight">{titre}</p>
              <p className="mt-2 text-ink-2 leading-relaxed">{texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-stone">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-14 lg:grid-cols-2">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Compris dans les {formatEuro(express.prixTTC)}</h2>
            <ul className="mt-8 grid gap-4 border-t border-ink pt-6">
              {express.inclus.map((i) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className="text-bronze">✓</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Pour quels projets</h2>
            <ul className="mt-8 grid gap-4 border-t border-ink pt-6">
              {express.conditions.map((c) => (
                <li key={c} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className="text-bronze">—</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-2 leading-relaxed">
              Votre projet sort de ce cadre ? Demandez quand même : nous vous proposons la formule adaptée, toujours à
              prix fixe annoncé avant de commencer.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Un maître d&apos;œuvre, pas une plateforme</h2>
          <p className="mt-6 text-ink-2 leading-relaxed max-w-[48ch]">
            {site.legal.company}, bureau d&apos;études installé au Havre. Un seul interlocuteur, joignable directement,
            qui connaît les règlements d&apos;urbanisme de la Seine-Maritime, de l&apos;Eure et du Calvados.
          </p>
          <address className="mt-6 not-italic text-sm leading-relaxed">
            <strong>{site.parent}</strong>
            <br />
            {site.address.street}, {site.address.zip} {site.address.city}
            <br />
            <TelLink source="express_bureau" className="underline decoration-brass underline-offset-4" />
          </address>
        </div>
        <div>
          <h2 className="display text-3xl">Vos questions</h2>
          <div className="mt-6 border-t border-ink">
            {faq.map(([q, r]) => (
              <details key={q} className="group border-b border-stone-2 py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold leading-snug">
                  {q}
                  <span aria-hidden="true" className="text-bronze transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-ink-2 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-20 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="display text-4xl sm:text-5xl max-w-[20ch]">Votre date butoir approche ?</p>
            <p className="mt-3 text-paper/75">Devis sous 4 h ouvrées. Dossier prêt en {express.delai}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#devis" className="btn btn-paper">Recevoir mon devis</a>
            <TelLink source="express_bas" className="btn btn-line-light">
              {site.phone}
            </TelLink>
          </div>
        </div>
      </section>

      <ExpressBarre />
    </>
  );
}
