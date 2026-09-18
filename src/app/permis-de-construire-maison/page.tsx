import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumb } from "@/lib/schema";
import { site } from "@/config/site";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/permis-de-construire-maison", {
  title: "Permis de construire maison individuelle : le guide complet",
  description:
    "Pièces PCMI 1 à 8, seuil des 150 m² et architecte, délais d'instruction, dépôt en ligne, affichage, RE2020, validité : tout ce qu'il faut savoir avant de déposer le permis de construire de votre maison.",
});

const toc = [
  ["pc-ou-dp", "Permis de construire ou déclaration préalable ?"],
  ["architecte", "Le seuil des 150 m² et l'architecte"],
  ["pieces", "Les pièces du dossier PCMI"],
  ["depot", "Où et comment déposer"],
  ["delais", "Les délais d'instruction"],
  ["affichage", "L'affichage et le recours des tiers"],
  ["re2020", "La RE2020 et les études techniques"],
  ["apres", "Après l'accord : validité, travaux, achèvement"],
] as const;

export default function GuidePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Permis de construire maison individuelle : le guide complet",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.legal.company },
    mainEntityOfPage: `${site.url}/permis-de-construire-maison`,
    inLanguage: "fr-FR",
  };

  return (
    <>
      <JsonLd
        data={[
          articleSchema,
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Le guide du permis", path: "/permis-de-construire-maison" },
          ]),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">Le guide</p>
          <h1 className="display mt-4 text-5xl sm:text-6xl lg:text-7xl max-w-[16ch]">
            Le permis de construire d&apos;une maison individuelle, <em>expliqué par un maître d&apos;œuvre.</em>
          </h1>
          <p className="lead mt-8 max-w-[56ch]">
            Ce qu&apos;il faut fournir, qui a le droit de dessiner, combien de temps ça prend et ce qui se passe après l&apos;accord. Écrit à partir des dossiers que nous déposons chaque semaine.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid gap-14 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ink-2">Sommaire</p>
          <ol className="mt-4 grid gap-2.5 text-[0.95rem] border-l border-stone-2">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block pl-4 -ml-px border-l border-transparent text-ink-2 hover:text-ink hover:border-brass">
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-10 border-t border-ink pt-5">
            <p className="display text-2xl">Vous voulez déléguer ?</p>
            <p className="mt-1 text-sm text-ink-2">Devis chiffré sous 48 h, prix fixe.</p>
            <Link href="/devis" className="btn btn-ink mt-5 w-full !min-h-11">Demander un devis</Link>
          </div>
        </aside>

        <article className="prose-guide">
          <h2 id="pc-ou-dp" className="!mt-0 scroll-mt-28">Permis de construire ou déclaration préalable ?</h2>
          <p>
            Une maison neuve relève toujours du permis de construire. La déclaration préalable (DP) est réservée aux petits travaux : une construction nouvelle entre 5 et 20 m² d&apos;emprise au sol ou de surface de plancher, une extension jusqu&apos;à 20 m² (portée à 40 m² en zone urbaine d&apos;un PLU, tant que la surface totale après travaux ne franchit pas le seuil des 150 m²), une clôture, une piscine de moins de 100 m², un changement d&apos;aspect de façade.
          </p>
          <p>
            Le formulaire du permis de construire de maison individuelle est le <strong>CERFA n° 13406</strong>. Il concerne la maison, ses annexes (garage, abri) et, le cas échéant, sa démolition préalable. Pour tout autre projet, c&apos;est le permis de construire « classique » (CERFA 13409), instruit en 3 mois au lieu de 2.
          </p>

          <h2 id="architecte" className="scroll-mt-28">Le seuil des 150 m² et l&apos;architecte</h2>
          <p>
            Un particulier qui construit pour lui-même peut se passer d&apos;architecte tant que la <strong>surface de plancher</strong> de la maison ne dépasse pas <strong>150 m²</strong>. Au-delà, le projet doit être signé par un architecte. C&apos;est la surface de plancher qui compte, pas la surface habitable : elle inclut l&apos;épaisseur des cloisons et les combles de plus de 1,80 m sous plafond ; les garages et aires de stationnement, eux, n&apos;y entrent pas.
          </p>
          <p>
            Jusqu&apos;à 149 m², un maître d&apos;œuvre comme {site.parent} conçoit les plans, monte le dossier et le dépose : c&apos;est le périmètre de nos formules à prix fixe. À partir de 150 m², le permis est établi sur devis uniquement, avec notre architecte partenaire.
          </p>

          <h2 id="pieces" className="scroll-mt-28">Les pièces du dossier PCMI</h2>
          <p>
            Le dossier de permis de construire de maison individuelle comporte huit pièces obligatoires, appelées PCMI 1 à PCMI 8 dans le bordereau du CERFA. D&apos;autres pièces s&apos;ajoutent selon le projet et la commune.
          </p>
          <table>
            <thead>
              <tr>
                <th>Pièce</th>
                <th>Ce qu&apos;elle montre</th>
                <th>Échelle usuelle</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>PCMI 1 — Plan de situation</td><td>Où se trouve le terrain dans la commune, avec le nord.</td><td>1/25 000 à 1/2 000</td></tr>
              <tr><td>PCMI 2 — Plan de masse</td><td>Implantation cotée, distances aux limites, accès, réseaux, arbres, courbes de niveau.</td><td>1/200 à 1/500</td></tr>
              <tr><td>PCMI 3 — Plan en coupe</td><td>Profil du terrain naturel et après travaux, hauteur de la maison, sous-sol.</td><td>1/100</td></tr>
              <tr><td>PCMI 4 — Notice</td><td>État initial du terrain, projet, matériaux, couleurs, traitement des accès et des espaces libres.</td><td>Texte</td></tr>
              <tr><td>PCMI 5 — Façades et toitures</td><td>Chaque façade cotée avec ses ouvertures, la toiture et ses pentes.</td><td>1/100</td></tr>
              <tr><td>PCMI 6 — Insertion</td><td>Le projet inséré dans une photo de son environnement, en 2D ou en rendu 3D.</td><td>—</td></tr>
              <tr><td>PCMI 7 — Photo proche</td><td>Le terrain et ses abords immédiats.</td><td>—</td></tr>
              <tr><td>PCMI 8 — Photo lointaine</td><td>Le terrain dans le paysage ou depuis la rue.</td><td>—</td></tr>
            </tbody>
          </table>
          <p>
            Selon la situation s&apos;ajoutent notamment : l&apos;attestation de prise en compte de la <a href="#re2020">RE2020</a>, l&apos;étude de gestion des eaux pluviales exigée par certains PLU, l&apos;attestation d&apos;un contrôleur technique en zone sismique, le formulaire de calcul de la surface taxable, ou encore une notice paysagère en site protégé.
          </p>

          <h2 id="depot" className="scroll-mt-28">Où et comment déposer</h2>
          <p>
            Le permis se dépose à la mairie de la commune où se situe le terrain. Depuis le 1<sup>er</sup> janvier 2022, toutes les communes doivent pouvoir recevoir les demandes d&apos;urbanisme par voie électronique, et celles de plus de 3 500 habitants disposent d&apos;une téléprocédure dédiée. Le dépôt en ligne est aujourd&apos;hui la règle : il évite les exemplaires papier et donne un récépissé immédiat.
          </p>
          <p>
            Le dépôt papier reste possible, en général en quatre exemplaires, avec un exemplaire supplémentaire dans certains cas (site protégé, avis de l&apos;Architecte des Bâtiments de France). C&apos;est la date du récépissé qui fait courir le délai d&apos;instruction.
          </p>

          <h2 id="delais" className="scroll-mt-28">Les délais d&apos;instruction</h2>
          <ul>
            <li><strong>2 mois</strong> pour un permis de construire de maison individuelle.</li>
            <li><strong>3 mois</strong> si le projet est situé aux abords d&apos;un monument historique ou dans un site protégé (avis de l&apos;Architecte des Bâtiments de France).</li>
            <li>Dans le mois qui suit le dépôt, la mairie peut demander des pièces manquantes ; vous avez alors 3 mois pour les fournir et le délai d&apos;instruction ne démarre qu&apos;à leur réception.</li>
            <li>Sans réponse à l&apos;issue du délai, le permis est en principe accordé tacitement. Un certificat de permis tacite peut être demandé à la mairie.</li>
          </ul>
          <p>
            Un dossier complet dès le premier jour, avec des cotes cohérentes entre le plan de masse, les coupes et les façades, est le meilleur moyen de tenir ces délais. C&apos;est la raison d&apos;être de notre contrôle de conformité au PLU avant dépôt.
          </p>

          <h2 id="affichage" className="scroll-mt-28">L&apos;affichage et le recours des tiers</h2>
          <p>
            Dès l&apos;obtention du permis, un panneau réglementaire doit être affiché sur le terrain, visible depuis la voie publique, pendant toute la durée des travaux. Il indique notamment le nom du bénéficiaire, la date et le numéro du permis, la nature du projet, la surface de plancher et la hauteur.
          </p>
          <p>
            Le <strong>recours des tiers</strong> (un voisin, par exemple) est ouvert pendant <strong>2 mois</strong> à compter du premier jour d&apos;affichage continu. L&apos;administration peut de son côté retirer un permis illégal dans les 3 mois qui suivent sa délivrance. Passés ces délais, le permis est « purgé ». Beaucoup de banques et de constructeurs attendent ce moment pour débloquer les fonds ou ouvrir le chantier.
          </p>

          <h2 id="re2020" className="scroll-mt-28">La RE2020 et les études techniques</h2>
          <p>
            La réglementation environnementale RE2020 s&apos;applique aux maisons individuelles dont le permis est déposé depuis le 1<sup>er</sup> janvier 2022. Au dépôt, le dossier doit contenir une <strong>attestation de prise en compte de la RE2020</strong>, établie à partir d&apos;une étude thermique et environnementale du projet. Une seconde attestation, plus complète, est exigée à l&apos;achèvement des travaux.
          </p>
          <p>
            Selon la commune, le PLU peut aussi imposer une étude de gestion des eaux pluviales à la parcelle (infiltration ou rétention), un raccordement particulier, ou un pourcentage de pleine terre. Nous vérifions ces exigences dans le règlement de votre zone avant de dessiner.
          </p>

          <h2 id="apres" className="scroll-mt-28">Après l&apos;accord : validité, travaux, achèvement</h2>
          <ul>
            <li>Le permis est valable <strong>3 ans</strong>. Il peut être prorogé deux fois pour un an, sur demande faite au moins deux mois avant l&apos;échéance.</li>
            <li>Une déclaration d&apos;ouverture de chantier (DOC) est déposée au démarrage des travaux.</li>
            <li>Si le projet évolue en cours de route, un permis modificatif suffit tant que la nature du projet n&apos;est pas bouleversée.</li>
            <li>À la fin, la déclaration attestant l&apos;achèvement et la conformité des travaux (DAACT) clôt le dossier. La mairie dispose de 3 mois pour contester la conformité (5 mois dans certains secteurs).</li>
            <li>La taxe d&apos;aménagement, calculée sur la surface taxable, est due après l&apos;achèvement des travaux ; le calcul est communiqué par l&apos;administration fiscale.</li>
          </ul>

          <div className="mt-14 border-t border-ink pt-8">
            <p className="display text-3xl">Vous préférez qu&apos;on s&apos;en occupe ?</p>
            <p className="mt-2 text-ink-2">Dossier complet, dépôt et suivi jusqu&apos;à l&apos;accord, à prix fixe, partout en France.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/devis" className="btn btn-ink">Demander un devis</Link>
              <Link href="/tarifs" className="btn btn-line">Voir les formules</Link>
            </div>
          </div>

          <p className="mt-10 text-sm text-ink-2">
            Ce guide décrit les règles générales du Code de l&apos;urbanisme en vigueur à la date de publication. Le règlement de votre commune (PLU, PLUi, carte communale) peut ajouter des exigences : nous les vérifions pour chaque projet.
          </p>
        </article>
      </div>
    </>
  );
}
