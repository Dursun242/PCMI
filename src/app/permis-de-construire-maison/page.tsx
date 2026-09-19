import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AuthorByline from "@/components/AuthorByline";
import Cta from "@/components/Cta";
import { articleSchema, breadcrumb, faqPageSchema } from "@/lib/schema";
import { getArticles } from "@/lib/articles";
import { site, plans } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { withSeo } from "@/lib/seo";

const PUBLISHED_AT = "2026-09-17";
const UPDATED_AT = "2026-09-19";

const guideFaq = [
  {
    q: "Le permis de construire est-il payant ?",
    a: "L'instruction du dossier par la mairie est gratuite. En revanche, la taxe d'aménagement est due après l'achèvement des travaux, et le montage du dossier a un coût si vous le confiez à un professionnel (voir la section « Combien coûte un permis de construire »).",
  },
  {
    q: "Puis-je déposer mon permis moi-même, sans professionnel ?",
    a: "Oui, tant que vous n'avez pas l'obligation de recourir à un architecte (surface de plancher de 150 m² ou moins). Beaucoup de particuliers montent leur dossier seuls ; le risque est surtout de mal évaluer une règle du PLU et de voir le permis refusé ou retardé par une demande de pièces.",
  },
  {
    q: "Puis-je commencer les travaux avant d'avoir le permis ?",
    a: "Non. Commencer des travaux sans permis (ou avant l'obtention d'un permis tacite) expose à un arrêt de chantier, à une remise en état et à des sanctions pénales. Il faut attendre la décision expresse ou l'expiration du délai d'instruction sans opposition de la mairie.",
  },
  {
    q: "Une extension ou une annexe nécessite-t-elle un permis de construire ?",
    a: "Cela dépend de la surface : en dessous des seuils de la déclaration préalable (voir la section « Permis de construire ou déclaration préalable »), une simple DP suffit. Au-delà, ou si la surface totale après travaux dépasse 150 m², c'est le permis de construire qui s'applique.",
  },
  {
    q: "Combien de temps le panneau de permis doit-il rester affiché ?",
    a: "Pendant toute la durée du chantier, et au minimum pendant les deux mois qui font courir le délai de recours des tiers. Le retirer trop tôt peut relancer ce délai si un tiers découvre le permis tardivement.",
  },
  {
    q: "Puis-je modifier mon projet après avoir obtenu le permis ?",
    a: "Oui, via un permis modificatif, tant que la nature du projet initial n'est pas bouleversée. Un changement plus important (implantation, volumétrie) peut nécessiter un nouveau permis de construire.",
  },
];

export const metadata: Metadata = withSeo("/permis-de-construire-maison", {
  title: "Permis de construire maison individuelle : le guide complet",
  description:
    "Pièces PCMI 1 à 8, seuil des 150 m² et architecte, délais d'instruction, dépôt en ligne, affichage, RE2020, validité : tout ce qu'il faut savoir avant de déposer le permis de construire de votre maison.",
});

const toc = [
  ["pc-ou-dp", "Permis de construire ou déclaration préalable ?"],
  ["architecte", "Le seuil des 150 m² et l'architecte"],
  ["cout", "Combien coûte un permis de construire"],
  ["pieces", "Les pièces du dossier PCMI"],
  ["pieces-complementaires", "Les pièces complémentaires"],
  ["depot", "Où et comment déposer"],
  ["delais", "Les délais d'instruction"],
  ["affichage", "L'affichage et le recours des tiers"],
  ["re2020", "La RE2020 et les études techniques"],
  ["taxe-amenagement", "La taxe d'aménagement"],
  ["apres", "Après l'accord : validité, travaux, achèvement"],
  ["faq", "Questions fréquentes"],
] as const;

export default function GuidePage() {
  const articles = getArticles();

  const guideSchema = articleSchema({
    path: "/permis-de-construire-maison",
    headline: "Permis de construire maison individuelle : le guide complet",
    description:
      "Ce qu'il faut fournir, qui a le droit de dessiner les plans, combien de temps prend l'instruction et ce qui se passe après l'accord.",
    datePublished: PUBLISHED_AT,
    dateModified: UPDATED_AT,
  });

  return (
    <>
      <JsonLd
        data={[
          guideSchema,
          faqPageSchema(guideFaq),
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
          <AuthorByline updatedAt={UPDATED_AT} />
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
            Le formulaire du permis de construire de maison individuelle est le{" "}
            <strong>
              <a href="https://www.service-public.fr/particuliers/vosdroits/R11637" target="_blank" rel="noopener noreferrer">CERFA n° 13406</a>
            </strong>
            . Il concerne la maison, ses annexes (garage, abri) et, le cas échéant, sa démolition préalable. Pour tout autre projet, c&apos;est le permis de construire « classique » (CERFA 13409), instruit en 3 mois au lieu de 2.
          </p>

          <h2 id="architecte" className="scroll-mt-28">Le seuil des 150 m² et l&apos;architecte</h2>
          <p>
            Un particulier qui construit pour lui-même peut se passer d&apos;architecte tant que la <strong>surface de plancher</strong> de la maison ne dépasse pas <strong>150 m²</strong> (<a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031732824" target="_blank" rel="noopener noreferrer">article R.431-2 du Code de l&apos;urbanisme</a>). Au-delà, le projet doit être signé par un architecte. C&apos;est la surface de plancher qui compte, pas la surface habitable : elle inclut l&apos;épaisseur des cloisons et les combles de plus de 1,80 m sous plafond ; les garages et aires de stationnement, eux, n&apos;y entrent pas. Trois surfaces différentes coexistent dans un dossier et se confondent facilement : nous les détaillons dans{" "}
            <Link href="/conseils/surface-de-plancher-emprise-au-sol-surface-taxable">surface de plancher, emprise au sol et surface taxable</Link>.
          </p>
          <p>
            Jusqu&apos;à 149 m², un maître d&apos;œuvre comme {site.parent} conçoit les plans, monte le dossier et le dépose : c&apos;est notre limite commerciale pour les formules à prix fixe, avec une marge de sécurité d&apos;1 m² sur le seuil légal. Au-delà de 149 m², le permis est établi sur devis, avec notre architecte partenaire dès que la surface de plancher dépasse 150 m² (l&apos;architecte n&apos;est pas obligatoire pour un projet de 150 m² pile, mais ce cas ne relève déjà plus de nos formules).
          </p>

          <h2 id="cout" className="scroll-mt-28">Combien coûte un permis de construire</h2>
          <p>
            Le prix dépend de qui monte le dossier : un architecte (obligatoire au-delà de 150 m²) facture le plus souvent entre 3 000 et 8 000 € TTC pour une mission limitée au permis, parfois en pourcentage du coût des travaux. Un maître d&apos;œuvre comme {site.parent} propose des formules à prix fixe, de {formatEuro(plans[0].priceTTC)} à {formatEuro(plans[plans.length - 1].priceTTC)} TTC selon le niveau d&apos;accompagnement (voir le <Link href="/tarifs">détail des trois formules</Link>). L&apos;instruction du dossier par la mairie, elle, est gratuite.
          </p>
          <p>
            Pour le détail des différentes façons de faire son permis (constructeur, architecte, maître d&apos;œuvre, plateforme en ligne) et ce qui doit être inclus dans un devis, voir notre article{" "}
            <Link href="/conseils/prix-permis-de-construire-maison-individuelle">Combien coûte un permis de construire pour une maison individuelle ?</Link>
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
            Selon la situation s&apos;ajoutent notamment : l&apos;attestation de prise en compte de la <a href="#re2020">RE2020</a>, l&apos;étude de gestion des eaux pluviales exigée par certains PLU, l&apos;attestation d&apos;un contrôleur technique en zone sismique, le formulaire de calcul de la surface taxable, ou encore une notice paysagère en site protégé — voir la section <a href="#pieces-complementaires">pièces complémentaires</a> ci-dessous.
          </p>
          <p>
            La pièce PCMI 6 (insertion graphique) est celle que l&apos;instructeur regarde en premier : voir notre article{" "}
            <Link href="/conseils/pcmi-6-insertion-graphique-reussie">PCMI 6 : réussir l&apos;insertion graphique de votre maison</Link>.
          </p>

          <Cta
            title="Un dossier complet, sans oubli."
            text="Nous contrôlons chaque pièce PCMI contre le règlement de votre commune avant dépôt."
            href="/devis"
            label="Demander un devis"
            secondaryHref="/permis-de-construire-maison#pieces-complementaires"
            secondaryLabel="Voir les pièces complémentaires"
          />

          <h2 id="pieces-complementaires" className="scroll-mt-28">Les pièces complémentaires</h2>
          <p>
            Au-delà des huit pièces PCMI 1 à 8, votre dossier peut nécessiter des pièces complémentaires selon le terrain et le projet :
          </p>
          <ul>
            <li><strong>PCMI 9 et PCMI 10</strong> — en lotissement : certificat du lotisseur indiquant la surface constructible attribuée au lot (PCMI 9) et, si les équipements ne sont pas achevés, certificat attestant l&apos;achèvement des voiries et réseaux (PCMI 10).</li>
            <li><strong>PCMI 12-2</strong> — attestation de conformité du projet d&apos;installation d&apos;assainissement non collectif, délivrée par le SPANC, lorsque le terrain n&apos;est pas raccordé au tout-à-l&apos;égout.</li>
            <li><strong>PCMI 13</strong> — attestation de prise en compte des règles parasismiques, en zone de sismicité 2 à 5 (non requise en zone 1, de sismicité très faible).</li>
            <li><strong>PCMI 14</strong> — attestation de prise en compte de la RE2020 (voir la section <a href="#re2020">RE2020</a> ci-dessous).</li>
          </ul>
          <p className="text-sm text-ink-2">
            Le sous-numéro exact de la pièce RE2020 (14-1 ou 14-2 selon la version du CERFA en vigueur au dépôt) dépend du millésime du formulaire : nous vérifions la version applicable au moment du dépôt de votre dossier.
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
            Un dossier complet dès le premier jour, avec des cotes cohérentes entre le plan de masse, les coupes et les façades, est le meilleur moyen de tenir ces{" "}
            <a href="https://www.service-public.fr/particuliers/vosdroits/F17656" target="_blank" rel="noopener noreferrer">délais d&apos;instruction</a>. C&apos;est la raison d&apos;être de notre contrôle de conformité au PLU avant dépôt.
          </p>
          <p>
            Le détail du décompte — point de départ, suspension par une demande de pièces, majorations, permis tacite et
            preuve à demander à la mairie — est repris dans notre article sur les{" "}
            <Link href="/conseils/delai-instruction-permis-de-construire-permis-tacite">délais d&apos;instruction et le permis tacite</Link>.
          </p>
          <p>
            Si malgré cela le permis est refusé, ce n&apos;est pas la fin du projet : voir notre article{" "}
            <Link href="/conseils/refus-de-permis-de-construire-que-faire">Refus de permis de construire : les causes fréquentes et comment rebondir</Link>.
          </p>

          <Cta
            title="Un devis avant de vous lancer."
            text="Nous lisons le règlement de votre commune et vous répondons sous 48 h ouvrées, avec un prix fixe."
            href="/devis"
            label="Demander un devis"
            secondaryHref="/tarifs"
            secondaryLabel="Voir les formules"
          />

          <h2 id="affichage" className="scroll-mt-28">L&apos;affichage et le recours des tiers</h2>
          <p>
            Dès l&apos;obtention du permis, un panneau réglementaire doit être affiché sur le terrain, visible depuis la voie publique, pendant toute la durée des travaux. Il indique notamment le nom du bénéficiaire, la date et le numéro du permis, la nature du projet, la surface de plancher et la hauteur.
          </p>
          <p>
            Le{" "}
            <a href="https://www.service-public.fr/particuliers/vosdroits/F17786" target="_blank" rel="noopener noreferrer"><strong>recours des tiers</strong></a>{" "}
            (un voisin, par exemple) est ouvert pendant <strong>2 mois</strong> à compter du premier jour d&apos;affichage continu. L&apos;administration peut de son côté retirer un permis illégal dans les 3 mois qui suivent sa délivrance. Passés ces délais, le permis est « purgé ». Beaucoup de banques et de constructeurs attendent ce moment pour débloquer les fonds ou ouvrir le chantier.
          </p>

          <h2 id="re2020" className="scroll-mt-28">La RE2020 et les études techniques</h2>
          <p>
            La réglementation environnementale RE2020 s&apos;applique aux maisons individuelles dont le permis est déposé depuis le 1<sup>er</sup> janvier 2022. Au dépôt, le dossier doit contenir une <strong>attestation de prise en compte de la RE2020</strong>, établie à partir d&apos;une étude thermique et environnementale du projet. Une seconde attestation, plus complète, est exigée à l&apos;achèvement des travaux.
          </p>
          <p>
            Selon la commune, le PLU peut aussi imposer une étude de gestion des eaux pluviales à la parcelle (infiltration ou rétention), un raccordement particulier, ou un pourcentage de pleine terre. Nous vérifions ces exigences dans le règlement de votre zone avant de dessiner.
          </p>

          <h2 id="taxe-amenagement" className="scroll-mt-28">La taxe d&apos;aménagement</h2>
          <p>
            La construction d&apos;une maison déclenche la{" "}
            <a href="https://www.economie.gouv.fr/particuliers/taxe-amenagement" target="_blank" rel="noopener noreferrer">taxe d&apos;aménagement</a>, calculée sur la surface taxable du projet. Les éléments nécessaires à son calcul doivent être déclarés dans les <strong>90 jours suivant l&apos;achèvement des travaux</strong>, depuis le service « Gérer mes biens immobiliers » de votre espace sur impots.gouv.fr (ou via le formulaire papier n° 6704). Passé ce délai, l&apos;administration peut appliquer une majoration et taxer d&apos;office sur la base des éléments dont elle dispose.
          </p>

          <h2 id="apres" className="scroll-mt-28">Après l&apos;accord : validité, travaux, achèvement</h2>
          <ul>
            <li>
              Le permis est{" "}
              <a href="https://www.service-public.fr/particuliers/vosdroits/F1988" target="_blank" rel="noopener noreferrer">valable 3 ans</a>. Il peut être prorogé deux fois pour un an, sur demande faite au moins deux mois avant l&apos;échéance.
            </li>
            <li>Une déclaration d&apos;ouverture de chantier (DOC) est déposée au démarrage des travaux.</li>
            <li>Si le projet évolue en cours de route, un permis modificatif suffit tant que la nature du projet n&apos;est pas bouleversée.</li>
            <li>
              À la fin, la{" "}
              <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F1997" target="_blank" rel="noopener noreferrer">déclaration attestant l&apos;achèvement et la conformité des travaux (DAACT)</a>{" "}
              clôt le dossier, dans les 90 jours suivant la fin du chantier. La mairie dispose de 3 mois pour contester la conformité (5 mois dans certains secteurs).
            </li>
            <li>
              La taxe d&apos;aménagement, calculée sur la surface taxable, est due après l&apos;achèvement des travaux (voir la section <a href="#taxe-amenagement">taxe d&apos;aménagement</a> ci-dessus).
            </li>
          </ul>

          <h2 id="faq" className="scroll-mt-28">Questions fréquentes</h2>
          <div className="divide-y divide-stone-2 border-y border-stone-2">
            {guideFaq.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 display text-xl leading-tight list-none [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="mt-1 shrink-0 text-brass transition-transform group-open:rotate-45" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="pb-6 pr-10 text-[1.02rem] leading-relaxed text-ink-2 max-w-[64ch]">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-14 border-t border-stone-2 pt-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ink-2">À lire aussi</p>
            {/* Alimenté par les articles réellement publiés : la liste ne peut pas dater. */}
            <ul className="!list-none !pl-0 mt-5 grid gap-4 sm:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/conseils/${a.slug}`} className="display text-xl leading-tight hover:text-brass">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/conseils" className="mt-6 inline-block text-sm underline decoration-brass underline-offset-4">
              Tous les conseils
            </Link>
          </div>

          <Cta
            title="Vous préférez qu'on s'en occupe ?"
            text="Dossier complet, dépôt et suivi jusqu'à l'accord, à prix fixe, partout en France."
            href="/devis"
            label="Demander un devis"
            secondaryHref="/tarifs"
            secondaryLabel="Voir les formules"
          />

          <p className="mt-10 text-sm text-ink-2">
            Ce guide décrit les règles générales du Code de l&apos;urbanisme en vigueur à la date de publication. Le règlement de votre commune (PLU, PLUi, carte communale) peut ajouter des exigences : nous les vérifions pour chaque projet.
          </p>
        </article>
      </div>
    </>
  );
}
