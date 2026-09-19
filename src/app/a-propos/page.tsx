import type { Metadata } from "next";
import Link from "next/link";
import { site, plans } from "@/config/site";
import { formatEuro } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { aboutPageSchema, breadcrumb } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { SURFACE_MAX } from "@/lib/formulaFinder";

export const metadata: Metadata = withSeo("/a-propos", {
  title: "Qui monte votre dossier de permis de construire",
  description:
    "Permis by ID Maîtrise est la marque de la SARL ID Maîtrise, maîtrise d'œuvre au Havre fondée par Dursun OZKAN. Méthode de travail, assurances et engagement de prix fixe.",
});

export default function AProposPage() {
  return (
    <>
      <JsonLd
        data={[
          aboutPageSchema(),
          breadcrumb([{ name: "Accueil", path: "/" }, { name: "À propos", path: "/a-propos" }]),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">À propos</p>
          <h1 className="display mt-4 text-5xl sm:text-6xl lg:text-7xl max-w-[18ch]">
            Derrière le site, un <em>maître d&apos;œuvre</em> et son agence.
          </h1>
          {/* Réponse d'abord : c'est ce paragraphe que citent les assistants. */}
          <p className="lead mt-8 max-w-[62ch]">
            {site.name} est la marque de {site.legal.company}, agence de maîtrise d&apos;œuvre installée au{" "}
            {site.address.city} et dirigée par {site.legal.director}. Nous ne sommes ni une place de marché, ni un
            intermédiaire : la personne qui dessine votre dossier de permis de construire est la même que celle qui
            répond à votre e-mail et qui suit l&apos;instruction en mairie.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 prose-guide">
        <h2>Une agence de maîtrise d&apos;œuvre, pas un service en ligne</h2>
        <p>
          {site.parent} conçoit et suit des chantiers de maisons individuelles, d&apos;extensions et de rénovations
          toute l&apos;année, depuis {site.address.street}, {site.address.zip} {site.address.city}. Le permis de
          construire n&apos;est qu&apos;une étape de ce métier : nous le déposons chaque semaine, nous savons ce
          qu&apos;un instructeur regarde en premier et ce qui déclenche une demande de pièces complémentaires.
        </p>
        <p>
          {site.name} est né d&apos;un constat simple : beaucoup de particuliers ont besoin du dossier de permis, et
          seulement de lui. Ils ont déjà leur constructeur, ou leur idée est arrêtée. Plutôt que de leur vendre une
          mission de maîtrise d&apos;œuvre complète, nous avons isolé cette prestation et lui avons donné un prix fixe.
          C&apos;est tout ce que ce site vend. Pour une mission de conception ou de suivi de chantier, c&apos;est{" "}
          <a href={site.parentUrl} rel="noopener">{site.parent}</a> qu&apos;il faut voir.
        </p>

        <h2>Qui dessine votre dossier</h2>
        <p>
          <strong>{site.legal.director}</strong>, maître d&apos;œuvre, fondateur de {site.legal.company}. Il rédige les
          contenus de ce site, établit les devis et monte les dossiers. Lorsque la surface de plancher dépasse 150 m² et
          que le recours à un architecte devient légalement obligatoire, le dossier est monté avec un architecte
          partenaire inscrit à l&apos;Ordre.
        </p>
        {/*
          TODO(Dursun) : photo de l'auteur (portrait 400×400 dans public/brand/)
          à ajouter ici. Un visage augmente nettement la crédibilité d'une page
          « à propos », et Google associe l'entité à une personne réelle.
        */}

        <h2>Ce qui nous engage</h2>
        <p>
          {site.legal.company} est immatriculée au RCS de {site.legal.rcs} sous le numéro SIREN {site.legal.siren}, et
          assurée en responsabilité civile professionnelle. Les mentions légales détaillent ces informations.
        </p>
        {/*
          TODO(Dursun) : garantie décennale — assureur et numéro de police à
          confirmer avant publication. Tant que l'attestation n'est pas fournie,
          cette page n'affirme que la RC professionnelle. Une garantie annoncée
          sans contrat derrière est une publicité trompeuse, et c'est
          exactement le genre de détail qu'un client vérifie avant de signer.
        */}
        <ul>
          <li>
            <strong>Prix fixe.</strong> Le montant annoncé dans le devis est celui de la facture. Les seules variations
            possibles sont les options que vous ajoutez vous-même. Nos formules vont de{" "}
            {formatEuro(plans[0].priceTTC)} à {formatEuro(plans[plans.length - 1].priceTTC)} TTC jusqu&apos;à{" "}
            {SURFACE_MAX} m² de surface de plancher.
          </li>
          <li>
            <strong>Aucun dossier déposé au hasard.</strong> Nous lisons le règlement d&apos;urbanisme de votre commune
            avant de chiffrer, pas après. C&apos;est la raison du délai de 48 h sur les devis.
          </li>
          <li>
            <strong>Pas de promesse d&apos;obtention.</strong> Personne ne peut garantir qu&apos;une mairie accordera un
            permis : la décision lui appartient. Nous nous engageons sur la conformité du dossier et, avec les formules
            Complet et Premium, sur sa reprise sans supplément si le refus porte sur un point que nous maîtrisons.
          </li>
        </ul>

        <h2>Comment nous travaillons</h2>
        <p>
          Tout se fait à distance, par e-mail, téléphone et visio, et le dépôt passe par la plateforme dématérialisée de
          votre commune. C&apos;est ce qui nous permet d&apos;intervenir partout en France au même prix. Un déplacement
          sur site reste possible en {site.address.region}.
        </p>
        <ol>
          <li>Vous décrivez votre projet et nous envoyez ce que vous avez : plan du terrain, esquisse, photos.</li>
          <li>Nous consultons le PLU ou le PLUi de votre commune et vous adressons un devis chiffré sous 48 h ouvrées.</li>
          <li>Nous dessinons les pièces PCMI 1 à 8, vous les relisez, nous ajustons.</li>
          <li>Selon la formule, vous déposez vous-même ou nous déposons et suivons l&apos;instruction jusqu&apos;à la décision.</li>
        </ol>

        <h2>Nous écrire</h2>
        <p>
          Par e-mail à <a href={`mailto:${site.email}`}>{site.email}</a>
          {site.phone ? <>, par téléphone au {site.phone}</> : null}, ou via le{" "}
          <Link href="/contact">formulaire de contact</Link>. Pour un chiffrage direct, le{" "}
          <Link href="/devis">formulaire de devis</Link> suffit.
        </p>
      </div>
    </>
  );
}
