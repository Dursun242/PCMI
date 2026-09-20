import Image from "next/image";
import Link from "next/link";
import { plans, site, faq } from "@/config/site";
import HouseDrawing from "@/components/HouseDrawing";
import PlanCard from "@/components/PlanCard";
import Faq from "@/components/Faq";
import FormulaFinder from "@/components/FormulaFinder";
import TrackedLink from "@/components/TrackedLink";
import Gallery from "@/components/Gallery";
import RealisationsGallery from "@/components/RealisationsGallery";
import JsonLd from "@/components/JsonLd";
import { faqPageSchema } from "@/lib/schema";
import { realisations } from "@data/realisations";
import { chiffresCles } from "@data/chiffres";

const pieces = [
  { code: "PCMI 1", name: "Plan de situation", what: "Situe le terrain dans la commune, avec l'orientation et l'échelle." },
  { code: "PCMI 2", name: "Plan de masse", what: "Implantation de la maison, distances aux limites, accès, réseaux, plantations." },
  { code: "PCMI 3", name: "Plan en coupe", what: "Profil du terrain avant et après travaux, hauteurs de la construction." },
  { code: "PCMI 4", name: "Notice descriptive", what: "Présente le terrain, le projet, les matériaux et les couleurs choisis." },
  { code: "PCMI 5", name: "Façades et toitures", what: "Chaque façade cotée, avec les menuiseries et la toiture." },
  { code: "PCMI 6", name: "Insertion graphique", what: "La maison dans son environnement réel, en 2D ou en rendu 3D." },
  { code: "PCMI 7", name: "Photographie proche", what: "Le terrain et ses abords immédiats." },
  { code: "PCMI 8", name: "Photographie lointaine", what: "Le terrain vu depuis la rue ou le paysage lointain." },
];

const steps = [
  {
    title: "Votre devis sous 4 h ouvrées",
    text: "Vous décrivez votre projet en trois minutes. Nous lisons le règlement d'urbanisme de votre commune et vous confirmons la formule, le prix et le délai.",
  },
  {
    title: "Conception et vérification",
    text: "Nous dessinons ou reprenons vos plans, contrôlons chaque règle (implantation, hauteur, emprise, aspect) et vous présentons le projet en visio.",
  },
  {
    title: "Dossier prêt à déposer",
    text: "Les huit pièces PCMI à l'échelle, la notice, le CERFA rempli et, selon la formule, les rendus 3D et l'attestation RE2020.",
  },
  {
    title: "Dépôt et suivi jusqu'à l'accord",
    text: "Nous déposons le dossier, répondons à la mairie et modifions ce qu'il faut. Vous recevez votre arrêté de permis de construire.",
  },
];

const compare = [
  {
    who: "Constructeur (CCMI)",
    plus: "Permis « offert » avec la maison",
    minus: "Vous dépendez de son catalogue et de son planning ; le permis n'est pas transférable si vous changez de constructeur.",
  },
  {
    who: "Architecte",
    plus: "Obligatoire au-delà de 150 m² de surface de plancher",
    minus: "Honoraires souvent calculés en pourcentage du coût des travaux.",
  },
  {
    who: "Plateforme en ligne",
    plus: "Prix d'appel bas",
    minus: "Dossier standardisé, sans lecture fine du PLU ni suivi humain en cas de refus.",
  },
  {
    who: site.name,
    plus: "Un bureau d'études qui allie ingénierie et architecture, dépose des permis toute l'année, à prix fixe, avec suivi jusqu'à l'accord",
    minus: "Formules à prix fixe jusqu'à 149 m² de surface de plancher ; au-delà, sur devis avec architecte partenaire.",
    me: true,
  },
];

const stats: { value: string; label: string }[] = [
  chiffresCles.permisDeposes != null && { value: `${chiffresCles.permisDeposes}+`, label: "permis de construire déposés" },
  chiffresCles.tauxAccordPremierDepot != null && { value: `${chiffresCles.tauxAccordPremierDepot} %`, label: "de taux d'accord au premier dépôt" },
  chiffresCles.noteGoogle != null && { value: `${chiffresCles.noteGoogle}/5`, label: "note moyenne des clients (Google)" },
].filter((s): s is { value: string; label: string } => Boolean(s));

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqPageSchema(faq)} />

      {/* ---------- Hero ---------- */}
      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="rule" aria-hidden="true" />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">100 % en ligne · partout en France</span>
            </div>
            <h1 className="display mt-7 text-[2.9rem] sm:text-6xl lg:text-[4.6rem] max-w-[13ch]">
              Le permis de construire de votre maison, <em>au prix juste.</em>
            </h1>
            <p className="mt-8 text-lg sm:text-xl leading-relaxed text-paper/75 max-w-[44ch]">
              Dossier complet, rendus 3D, dépôt en mairie et suivi jusqu&apos;à l&apos;accord — à distance, sans rendez-vous physique. Conçu par un bureau d&apos;études qui allie ingénierie et architecture, à partir de{" "}
              <span className="text-paper">{new Intl.NumberFormat("fr-FR").format(plans[0].priceTTC)}&nbsp;€&nbsp;TTC</span>.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <TrackedLink href="/devis" source="hero_accueil" className="btn btn-paper">Demander un devis</TrackedLink>
              <Link href="/tarifs" className="btn btn-line-light">Découvrir les formules</Link>
            </div>
          </div>

          <div className="relative">
            {/*
              Vidéo de la façade qui se dessine (20 s, muette, en boucle), sur le
              même vert que le hero. Le dessin SVG reste en repli pour les
              navigateurs sans vidéo et pour les lecteurs d'écran.
            */}
            <video
              className="w-full h-auto aspect-video object-cover [mask-image:radial-gradient(ellipse_at_center,#000_58%,transparent_100%)]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/hero/facade-poster.jpg"
              aria-label="Façade d'une maison contemporaine qui se dessine trait par trait, comme sur la planche PCMI 5"
            >
              <source src="/hero/facade.mp4" type="video/mp4" />
              <HouseDrawing className="w-full h-auto" />
            </video>
            {/* Voile dégradé sur le coin bas droit : cache le filigrane de la vidéo. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at 100% 100%, #22352c 0, #22352c 15%, rgba(34,53,44,0) 30%)" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ---------- Chiffres ---------- */}
      {stats.length > 0 && (
        <section className="border-b border-stone-2">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="numeral text-5xl sm:text-6xl">{s.value}</div>
                <p className="mt-2 text-ink-2 max-w-[26ch]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Les 8 pièces ---------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Ce que contient votre dossier</h2>
            <p className="lead mt-6 max-w-[38ch]">
              Un permis de construire de maison individuelle se compose de huit pièces réglementaires, numérotées PCMI 1 à 8. Nous les produisons toutes, à l&apos;échelle, dans un dossier prêt à être instruit.
            </p>
            <p className="mt-6 text-ink-2 max-w-[38ch]">
              Plus le CERFA n° 13406 rempli, le contrôle du PLU et, selon la formule, l&apos;attestation RE2020 et l&apos;étude des eaux pluviales.
            </p>
            <p className="mt-6 text-ink-2 max-w-[38ch]">
              Pour comprendre à quoi sert chaque pièce et ce que la mairie en fait, lisez notre{" "}
              <Link href="/permis-de-construire-maison" className="text-ink underline decoration-brass underline-offset-4">
                guide du permis de construire de maison individuelle
              </Link>
              .
            </p>
          </div>
          <ol className="grid sm:grid-cols-2 border-t border-ink">
            {pieces.map((p) => (
              <li key={p.code} className="py-6 pr-6 border-b border-stone-2 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(even)]:pl-6">
                <div className="text-[0.7rem] font-bold tracking-[0.2em] text-brass">{p.code}</div>
                <h3 className="display mt-2 text-2xl leading-tight">{p.name}</h3>
                <p className="mt-2 text-[0.95rem] text-ink-2 leading-relaxed">{p.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section className="bg-stone">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6 max-w-[16ch]">Du premier échange au permis accordé</h2>
          <ol className="mt-14 grid gap-12 md:grid-cols-2 lg:grid-cols-4 border-t border-ink pt-8">
            {steps.map((s, i) => (
              <li key={s.title}>
                <div className="numeral text-4xl text-brass">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="display mt-4 text-2xl leading-tight">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Formules ---------- */}
      <section id="formules" className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[48ch]">
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Trois formules, un prix fixe</h2>
            <p className="lead mt-6">
              Pour les maisons jusqu&apos;à 149 m² de surface de plancher, sans architecte. Le prix dépend de ce que nous faisons pour vous, pas de la valeur de votre maison : il est annoncé dans le devis et ne bouge plus. Au-delà de 149 m², sur devis uniquement.
            </p>
          </div>
          <Link href="/tarifs" className="btn btn-line">Comparer en détail</Link>
        </div>
        <div className="mt-14 grid gap-8 lg:gap-0 lg:grid-cols-3 lg:items-stretch">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} compact />
          ))}
        </div>
      </section>

      {/* ---------- Sélecteur de formule ---------- */}
      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
          <FormulaFinder />
        </div>
      </section>

      {/* ---------- Galerie ---------- */}
      {realisations.length >= 3 ? <RealisationsGallery items={realisations} /> : <Gallery />}

      {/* ---------- Pourquoi ID Maîtrise ---------- */}
      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="max-w-[52ch]">
              <span className="rule" aria-hidden="true" />
              <h2 className="h-section mt-6">Pourquoi confier votre permis à un bureau d&apos;études qui dessine aussi</h2>
              <p className="mt-6 text-lg leading-relaxed text-paper/75">
                {site.parent} réunit l&apos;ingénierie d&apos;un bureau d&apos;études et la conception architecturale : dessinateur-projeteur, ingénieur béton armé et structure, thermicien, et architecte partenaire quand la loi l&apos;impose. La maison est dessinée par ceux qui la calculent. Nous concevons et suivons des chantiers toute l&apos;année, nous savons ce qu&apos;un instructeur regarde, ce qu&apos;un PLU interdit, et ce qui fait qu&apos;un dossier passe du premier coup et se construit ensuite sans surprise.
              </p>
            </div>
            <div className="relative h-64 sm:h-80 overflow-hidden">
              <Image
                src="/office/bureau-id-maitrise.jpg"
                alt={`Bureau d'${site.parent}, ingénierie et architecture au Havre`}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <span className="absolute left-0 bottom-0 m-4 bg-paper/92 px-3 py-1.5 text-xs tracking-[0.06em] text-ink">
                Notre bureau, {site.address.city}
              </span>
            </div>
          </div>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-[0.95rem]">
              <thead>
                <tr className="text-left text-[0.7rem] uppercase tracking-[0.18em] text-brass-2">
                  <th className="py-3 pr-6 font-bold border-b border-brass/50">Qui fait votre permis</th>
                  <th className="py-3 pr-6 font-bold border-b border-brass/50">Ce que vous gagnez</th>
                  <th className="py-3 font-bold border-b border-brass/50">Ce qu&apos;il faut savoir</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((c) => (
                  <tr key={c.who} className={c.me ? "text-paper" : "text-paper/75"}>
                    <td className={`py-5 pr-6 align-top border-b border-paper/15 ${c.me ? "display text-xl" : "font-bold"}`}>{c.who}</td>
                    <td className="py-5 pr-6 align-top border-b border-paper/15">{c.plus}</td>
                    <td className="py-5 align-top border-b border-paper/15">{c.minus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Questions fréquentes</h2>
          <p className="mt-6 text-ink-2 leading-relaxed max-w-[32ch]">
            Nos{" "}
            <Link href="/conseils" className="text-ink underline decoration-brass underline-offset-4">
              articles de conseils
            </Link>{" "}
            traitent les cas particuliers : prix, refus, affichage du panneau, insertion graphique.
          </p>
          <p className="mt-4 text-ink-2 leading-relaxed max-w-[32ch]">
            Une autre question ?{" "}
            <Link href="/contact" className="text-ink underline decoration-brass underline-offset-4">
              Écrivez-nous
            </Link>
            .
          </p>
        </div>
        <Faq />
      </section>

      {/* ---------- Après le permis : plans d'exécution ---------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="border-t border-ink pt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Et après le permis&nbsp;: les plans pour construire</h2>
          </div>
          <div>
            <p className="lead">
              Les pièces du permis montrent ce que vous avez le droit de bâtir, pas comment. Fondations, béton armé,
              plancher, charpente, réseaux&nbsp;: nous dessinons aussi les plans d&apos;exécution que lisent vos artisans,
              à l&apos;unité ou en pack, à prix fixe, calculés par notre bureau d&apos;études pour ce qui porte.
            </p>
            <p className="mt-5 text-ink-2 leading-relaxed">
              Et pour le volet réglementaire, notre thermicien établit l&apos;attestation RE2020, l&apos;étude complète
              (Bbio, Cep, confort d&apos;été) et l&apos;analyse de cycle de vie des matériaux.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plans-execution" className="btn btn-line">Les plans d&apos;exécution</Link>
              <Link href="/etude-thermique-re2020" className="btn btn-line">L&apos;étude thermique RE2020</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="border-t border-ink pt-12 flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[36ch]">
            <h2 className="display text-4xl sm:text-5xl">Votre devis chiffré sous 4 h ouvrées.</h2>
            <p className="mt-4 text-ink-2 leading-relaxed">Trois minutes pour décrire votre projet. Aucun engagement, aucun frais caché.</p>
          </div>
          <TrackedLink href="/devis" source="accueil_final" className="btn btn-ink">Demander un devis</TrackedLink>
        </div>
      </section>
    </>
  );
}
