import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import ExpressForm from "@/components/ExpressForm";
import ExpressBarre from "@/components/ExpressBarre";
import ExpressVideo from "@/components/ExpressVideo";
import ExpressVue from "@/components/ExpressVue";
import TelLink from "@/components/TelLink";
import WhatsAppLink from "@/components/WhatsAppLink";
import { chantiers, vitrine } from "@/config/references";
import { express, site } from "@/config/site";
import { FAQ_EXPRESS } from "@/lib/express";
import { formatEuro, formatFrDate } from "@/lib/format";
import type { ReferenceVitrine } from "@/lib/vitrine";

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

/** Les quatre étapes de la vidéo, écrites dessous pour qui ne la lance pas (et pour les moteurs de recherche). */
const etapes: [string, string, string][] = [
  ["Jour 0", "Votre parcelle", "Vous nous envoyez le numéro de parcelle et vos documents ; nous vérifions le PLU. Devis sous 4 h ouvrées."],
  [`Sous ${express.premiersPlans}`, "Votre maison", "Une ou deux propositions, en plan et en façade, sur votre terrain."],
  ["À votre rythme", "Votre accord", "Vous validez, ou nous modifions. Rien n’est déposé sans votre accord."],
  [`En ${express.delai}`, "Le dépôt", "Pièces PCMI 1 à 8 et CERFA déposées en ligne ; vous recevez le récépissé pour votre notaire."],
];

/**
 * Toutes les maisons des références du bureau (src/config/references.ts),
 * les plus belles d'abord (ordre de la `vitrine` de l'accueil). Communes
 * seulement, jamais d'adresse ; immeubles et bâtiments publics écartés.
 */
const rang = (photo: string) => (vitrine.includes(photo) ? vitrine.indexOf(photo) : vitrine.length);
const maisons: ReferenceVitrine[] = chantiers
  .filter((c) => /maison|plain-pied|logements individuels/i.test(c.titre))
  .sort((a, b) => rang(a.photo) - rang(b.photo))
  .map(({ titre, commune, photo }) => ({ titre, commune, photo }));

/** Relance vers le formulaire, posée entre les sections. */
function RelanceDevis({ titre, zone }: { titre: string; zone: "relance1" | "relance2" }) {
  return (
    <div data-zone={zone} className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="flex flex-col gap-5 border border-ink bg-paper p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="display text-3xl leading-tight">{titre}</p>
          <p className="mt-2 text-ink-2">
            Devis gratuit sous 4 h ouvrées, prix fixe de {formatEuro(express.prixTTC)} TTC. Sans engagement.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-[3fr_2fr] gap-3 md:flex">
          <a href="#devis" className="btn btn-ink whitespace-nowrap !px-3 sm:!px-7">Mon devis gratuit</a>
          <TelLink source="express_relance" className="btn btn-line !px-3 sm:!px-7">
            Appeler
          </TelLink>
        </div>
      </div>
    </div>
  );
}

export default function PermisExpressPage() {
  if (!express.actif) redirect("/devis");

  return (
    <>
      {/* Hero et formulaire côte à côte sur grand écran : l'action est visible sans défiler. */}
      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-8 pb-12 sm:py-20 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div data-zone="hero" className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="rule" aria-hidden="true" />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">
                Seine-Maritime · Eure · Calvados
              </span>
            </div>
            <h1 className="display mt-5 sm:mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem] max-w-[16ch]">
              Votre permis de construire de plain-pied, <em>prêt en {express.delai.replace(" ouvrés", "")}.</em>
            </h1>
            <p className="mt-5 sm:mt-7 text-base sm:text-xl leading-relaxed text-paper/80 max-w-[48ch]">
              Compromis signé, date butoir, banque qui attend : un maître d&apos;œuvre du Havre monte votre dossier
              et le dépose en ligne, sans vous faire perdre une semaine.
            </p>

            {/* Prix et actions dans le premier écran du téléphone : le visiteur vient d'une annonce qui les promet. */}
            <div className="mt-6 sm:mt-10 border-l-2 border-brass-2 pl-5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">Formule {express.nom}</p>
              <p className="mt-1 sm:mt-2">
                <span className="display text-4xl sm:text-5xl">{formatEuro(express.prixTTC)}</span>{" "}
                <span className="text-paper/80">TTC, prix fixe</span>
              </p>
              <p className="mt-1 sm:mt-2 text-sm text-paper/70 max-w-[46ch]">
                Maison de plain-pied jusqu&apos;à {express.surfaceMax} m², dépôt en ligne inclus. Réservée aux{" "}
                {express.places} premiers dossiers, devis demandé avant le {formatFrDate(express.fin)}.
              </p>
            </div>

            <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-4">
              <a href="#devis" className="btn btn-paper !px-3 sm:!px-7 lg:!hidden">
                Mon devis gratuit
              </a>
              <TelLink source="express_hero" className="btn btn-line-light !px-3 sm:!px-7 lg:!border-transparent lg:!bg-paper lg:!text-ink lg:hover:!bg-brass-2">
                <span className="sm:hidden">Appeler</span>
                <span className="hidden sm:inline">Appeler le {site.phone}</span>
              </TelLink>
              <WhatsAppLink
                source="express_hero"
                text="Bonjour, j'ai besoin d'un permis de construire rapidement pour une maison de plain-pied."
                className="col-span-2 justify-self-start text-paper underline decoration-brass-2 underline-offset-4"
              >
                Écrire sur WhatsApp
              </WhatsAppLink>
            </div>

            {/* Réalisations dès le haut de page : sur téléphone avant le formulaire, sur ordinateur à côté. */}
            <div data-section="maisons" className="mt-10 sm:mt-12" aria-labelledby="realises">
              <h2 id="realises" className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">
                Nos réalisations en Normandie
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-paper/80 max-w-[52ch]">
                Plans, permis et études : notre bureau. Ces maisons ont été construites à partir de nos plans.
              </p>
              <ul className="mt-5 -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0">
                {maisons.map((c, i) => (
                  <li key={c.photo} className="w-[78%] shrink-0 snap-start sm:w-[45%]">
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden bg-paper/10">
                        <Image
                          src={c.photo}
                          alt={`${c.titre}, ${c.commune}, construite sur les plans du bureau`}
                          fill
                          loading={i < 2 ? "eager" : "lazy"}
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 78vw"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="mt-2 text-sm leading-snug">
                        <strong>{c.titre}</strong>
                        <span className="block text-paper/70">{c.commune}</span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-paper/60" aria-hidden="true">Faites glisser pour voir les autres maisons →</p>
            </div>
          </div>

          <div id="devis" data-section="formulaire" className="scroll-mt-24 bg-paper text-ink px-6 py-8 sm:px-9 sm:py-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">Gratuit · sans engagement</p>
            <h2 className="display mt-3 text-4xl leading-tight">Recevez votre devis sous 4 h ouvrées</h2>
            <p className="mt-3 text-sm text-ink-2">Trois champs obligatoires, une minute. Nous vous rappelons avec un prix fixe.</p>
            <div className="mt-8">
              <ExpressForm />
            </div>
          </div>
        </div>
      </section>

      <section data-section="deroule" className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="deroule">
        <span className="rule" aria-hidden="true" />
        <h2 id="deroule" className="h-section mt-6">Du premier appel au dépôt</h2>
        <div className="mt-10">
          <ExpressVideo />
        </div>
        <ol className="mt-px grid gap-px bg-stone-2 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map(([quand, titre, texte], i) => (
            <li key={titre} className="bg-paper p-5 sm:p-6">
              <span className="numeral text-2xl text-bronze">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">{quand}</p>
              <p className="display mt-1 text-2xl leading-tight">{titre}</p>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed">{texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <RelanceDevis zone="relance1" titre="Votre maison sera la prochaine." />

      <section data-section="compris" className="mt-16 sm:mt-24 bg-stone">
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
        <div className="pb-16 sm:pb-24">
          <RelanceDevis zone="relance2" titre={"Un doute sur votre projet\u00a0? Demandez, c\u2019est gratuit."} />
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
          <address data-zone="bureau" className="mt-6 not-italic text-sm leading-relaxed">
            <strong>{site.parent}</strong>
            <br />
            {site.address.street}, {site.address.zip} {site.address.city}
            <br />
            <TelLink source="express_bureau" className="underline decoration-brass underline-offset-4" />
          </address>
        </div>
        <div data-section="questions">
          <h2 className="display text-3xl">Vos questions</h2>
          <div className="mt-6 border-t border-ink">
            {FAQ_EXPRESS.map(({ cle, question: q, reponse: r }) => (
              <details key={cle} data-faq={cle} className="group border-b border-stone-2 py-5">
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

      <section data-section="fin" data-zone="bas" className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-20 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="display text-4xl sm:text-5xl max-w-[20ch]">Votre date butoir approche ?</p>
            <p className="mt-3 text-paper/75">Devis sous 4 h ouvrées. Dossier prêt en {express.delai}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#devis" className="btn btn-paper">Mon devis gratuit</a>
            <TelLink source="express_bas" className="btn btn-line-light">
              {site.phone}
            </TelLink>
          </div>
        </div>
      </section>

      <ExpressBarre />
      <ExpressVue />
    </>
  );
}
