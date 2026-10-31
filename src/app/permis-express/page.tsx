import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import ExpressForm from "@/components/ExpressForm";
import ExpressPiecesDossier from "@/components/ExpressPiecesDossier";
import BandeauDefilant from "@/components/BandeauDefilant";
import ExpressBarre from "@/components/ExpressBarre";
import ExpressConfiance, { AVIS_GOOGLE, NOTE_GOOGLE } from "@/components/ExpressConfiance";
import ExpressVue from "@/components/ExpressVue";
import TelLink from "@/components/TelLink";
import WhatsAppLink from "@/components/WhatsAppLink";
import { chantiers, vitrine } from "@/config/references";
import { express, site } from "@/config/site";
import { FAQ_EXPRESS } from "@/lib/express";
import { formatEuro, formatFrDate } from "@/lib/format";
import type { ReferenceVitrine } from "@/lib/vitrine";
import PaiementFractionne from "@/components/PaiementFractionne";

/**
 * Page d'atterrissage de la campagne Google Ads « permis express »
 * (départements : `express.departements`). Une seule offre, une action
 * principale : commander en ligne ; pour qui préfère en parler d'abord, le
 * rappel dans l'heure et le téléphone restent. Pas d'indexation : la page sert la
 * publicité et ne doit pas concurrencer les pages du référencement naturel.
 *
 * Contenu commercial (prix, délais, ce qui est compris) : `express` dans src/config/site.ts.
 */
/** Le panier, formule Express déjà choisie. */
const COMMANDER_EXPRESS = "/commander?formule=express";

/** « Seine-Maritime, Eure… ou Somme » : la liste des départements de la campagne, en français. */
const zone = (mot: "et" | "ou") =>
  `${express.departements.slice(0, -1).join(", ")} ${mot} ${express.departements[express.departements.length - 1]}`;

export const metadata: Metadata = {
  title: `Permis de construire express dès ${formatEuro(express.prixTTC)}`,
  description: `Maison jusqu'à ${express.surfaceMax} m², plain-pied ou à étage, en ${zone("ou")} : rappel ${express.rappel.delai}, premiers plans sous ${express.premiersPlans}, dossier PCMI prêt en ${express.delai}.`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/permis-express" },
};

/** Les quatre étapes d'un dossier Express, du premier appel au dépôt (la vidéo, peu regardée ici, reste sur l'accueil). */
const etapes: [string, string, string][] = [
  ["Jour 0", "Votre commande", "Vous commandez en ligne, en 1, 4 ou 10 fois ; nous vérifions le PLU de votre parcelle avant de lancer le dossier. Rien n’est prélevé avant."],
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
            Prix fixe de {formatEuro(express.prixTTC)} TTC, en 1, 4 ou 10 fois sans frais, devis immédiat. Rien n&apos;est prélevé avant la vérification de votre terrain.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 md:flex">
          <Link href={COMMANDER_EXPRESS} className="btn btn-ink col-span-2 whitespace-nowrap !px-3 sm:!px-7 md:col-span-1">Commander l&apos;Express</Link>
          <TelLink source="express_relance" className="btn btn-line col-span-2 !px-3 sm:!px-7 md:col-span-1">
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
                {express.departements.join(" · ")}
              </span>
            </div>
            <h1 className="display mt-5 sm:mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem] max-w-[16ch]">
              Votre permis de construire, <em>prêt en {express.delai.replace(" ouvrés", "")}.</em>
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
              <PaiementFractionne sombre prixTTC={express.prixTTC} className="mt-2" />
              <p className="mt-1 sm:mt-2 text-sm text-paper/70 max-w-[46ch]">
                Maison jusqu&apos;à {express.surfaceMax} m² de surface de plancher, plain-pied ou à étage, dépôt en ligne
                inclus. Offre valable pour toute commande passée avant le {formatFrDate(express.fin)}.
              </p>
              <ExpressPiecesDossier />
            </div>

            <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-4">
              {/* Sur téléphone, le bouton principal prend toute la largeur : son libellé tient sur une ligne. */}
              <Link href={COMMANDER_EXPRESS} className="btn btn-paper col-span-2 whitespace-nowrap !px-3 sm:!px-7">
                Commander l&apos;Express
              </Link>
              <TelLink source="express_hero" className="btn btn-line-light col-span-2 !px-3 sm:!px-7 lg:!border-transparent lg:!bg-paper lg:!text-ink lg:hover:!bg-brass-2">
                <span className="sm:hidden">Appeler</span>
                <span className="hidden sm:inline">Appeler le {site.phone}</span>
              </TelLink>
              <WhatsAppLink
                source="express_hero"
                text="Bonjour, j'ai besoin d'un permis de construire rapidement pour ma maison."
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
              <BandeauDefilant className="mt-5 -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0">
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
              </BandeauDefilant>
              <p className="mt-1 text-xs text-paper/60 [@media(pointer:fine)]:hidden" aria-hidden="true">Faites glisser pour voir les autres maisons →</p>
            </div>
          </div>

          <div id="devis" data-section="formulaire" className="scroll-mt-24 bg-paper text-ink px-6 py-8 sm:px-9 sm:py-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">Commande en ligne</p>
            <h2 className="display mt-3 text-4xl leading-tight">Votre permis Express, {formatEuro(express.prixTTC)} TTC</h2>
            <PaiementFractionne prixTTC={express.prixTTC} className="mt-3" />
            <p className="mt-3 text-sm text-ink-2">
              Par prélèvement. Rien n&apos;est prélevé avant que nous ayons vérifié que votre terrain permet le permis.
            </p>
            <Link href={COMMANDER_EXPRESS} className="btn btn-ink mt-5 w-full">
              Commander l&apos;Express
            </Link>
            <p className="mt-8 border-t border-stone-2 pt-6 display text-2xl leading-tight">Vous préférez en parler d&apos;abord ?</p>
            <p className="mt-2 text-sm text-ink-2">
              Laissez votre numéro : nous vous rappelons {express.rappel.delai}, {express.rappel.horaires} ; {express.rappel.sinon}.
            </p>
            {/* La preuve au moment d'hésiter : qui rappelle, et ce qu'en disent les clients. */}
            <a href={AVIS_GOOGLE} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center gap-3 border-y border-stone-2 py-3">
              <Image src="/confiance/dursun-ozkan-medaillon.jpg" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              <span className="text-sm leading-snug">
                <span className="font-bold">Dursun Ozkan</span> vous rappelle
                <span className="block text-ink-2">
                  <span className="font-bold text-ink">{NOTE_GOOGLE.moyenne}</span>{" "}
                  <span aria-hidden="true" className="tracking-[0.1em] text-bronze">★★★★★</span>{" "}
                  <span className="underline decoration-brass underline-offset-2">{NOTE_GOOGLE.nombre} avis Google</span>
                </span>
              </span>
            </a>
            <div className="mt-6">
              <ExpressForm />
            </div>
          </div>
        </div>
      </section>

      <ExpressConfiance />

      <section data-section="deroule" className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="deroule">
        <span className="rule" aria-hidden="true" />
        <h2 id="deroule" className="h-section mt-6">Du premier appel au dépôt</h2>
        <ol data-stagger className="mt-10 grid gap-px border border-stone-2 bg-stone-2 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Compris dans les {formatEuro(express.prixTTC)}</h2>
          <ul className="mt-8 grid gap-x-14 gap-y-4 border-t border-ink pt-6 md:grid-cols-2">
            {express.inclus.map((i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span aria-hidden="true" className="text-bronze">✓</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
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
            qui connaît les règlements d&apos;urbanisme de vos départements : {zone("et")}.
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
            <p className="mt-3 text-paper/75">Commande en ligne, en 1, 4 ou 10 fois. Dossier prêt en {express.delai}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={COMMANDER_EXPRESS} className="btn btn-paper">Commander l&apos;Express</Link>
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
