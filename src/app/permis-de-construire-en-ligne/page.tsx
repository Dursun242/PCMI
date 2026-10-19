import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Cta from "@/components/Cta";
import TrackedLink from "@/components/TrackedLink";
import { breadcrumb, faqPageSchema, serviceSchema } from "@/lib/schema";
import { options, plans } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { withSeo } from "@/lib/seo";

/**
 * Page d'atterrissage « permis de construire en ligne » : les quatre questions
 * qu'on tape avant de confier son permis (comment faire, quel délai, combien
 * ça coûte, et que faut-il fournir), avec nos réponses chiffrées. Les prix et
 * les délais de préparation viennent de src/config/site.ts.
 */
export const metadata: Metadata = withSeo("/permis-de-construire-en-ligne", {
  title: "Permis de construire en ligne : délai, démarches et prix",
  description: `Faites votre permis de construire de maison en ligne : devis sous 4 h ouvrées, dossier PCMI prêt en ${plans[0].delayWorkingDays.replace(" jours ouvrés", "")} à ${plans[plans.length - 1].delayWorkingDays}, dépôt dématérialisé, prix fixe dès ${formatEuro(plans[0].priceTTC)} TTC.`,
});

const optionDp = options.find((o) => o.name.startsWith("Déclaration préalable"));
const complet = plans.find((p) => p.id === "complet") ?? plans[1];

const etapes = [
  {
    titre: "Vous décrivez votre projet",
    texte:
      "Adresse du terrain, surface envisagée, plan du constructeur, croquis ou simples photos : le formulaire prend 3 minutes. Vous recevez un devis à prix fixe sous 4 h ouvrées.",
  },
  {
    titre: "Nous vérifions le PLU",
    texte:
      "Avant de dessiner, nous lisons les règles de votre parcelle (implantation, hauteur, aspect, emprise) pour que le dossier soit conforme dès le dépôt.",
  },
  {
    titre: "Nous montons le dossier PCMI",
    texte: `Plans de masse, coupes, façades, notice, insertion graphique, CERFA : toutes les pièces PCMI 1 à 8, prêtes en ${plans[0].delayWorkingDays} à ${plans[plans.length - 1].delayWorkingDays} selon la formule.`,
  },
  {
    titre: "Nous déposons en ligne",
    texte:
      "Avec les formules Complet et Premium, nous déposons le dossier sur le guichet numérique de votre commune et vous transmettons le récépissé.",
  },
  {
    titre: "Nous suivons jusqu'à l'accord",
    texte:
      "Si la mairie demande des pièces complémentaires, nous y répondons et modifions le dossier sans supplément (formules Complet et Premium), jusqu'à l'arrêté de permis.",
  },
];

const faqEnLigne = [
  {
    q: "Peut-on vraiment faire son permis de construire en ligne ?",
    a: "Oui. Depuis le 1er janvier 2022, toutes les communes doivent pouvoir recevoir les demandes de permis de construire par voie électronique. De notre côté, tout se fait à distance : vous nous envoyez vos documents, nous échangeons par téléphone, visio ou e-mail, et le dossier est déposé sur le guichet numérique de votre commune.",
  },
  {
    q: "Quel est le délai total pour obtenir un permis de construire ?",
    a: `Comptez le temps de préparation du dossier (${plans[0].delayWorkingDays} à ${plans[plans.length - 1].delayWorkingDays} chez nous selon la formule), puis 2 mois d'instruction par la mairie pour une maison individuelle, 3 mois en secteur protégé. Une demande de pièces dans le premier mois repousse le départ de ce délai. Après l'accord, le permis doit encore être affiché 2 mois pour purger le recours des tiers.`,
  },
  {
    q: "Combien coûte un permis de construire fait en ligne ?",
    a: `L'instruction par la mairie est gratuite. Le montage du dossier par notre bureau d'études coûte ${plans.map((p) => `${formatEuro(p.priceTTC)} TTC (${p.name})`).join(", ")}, à prix fixe, quelle que soit la surface jusqu'à 149 m². La taxe d'aménagement, due après les travaux, s'ajoute pour toute construction.`,
  },
  {
    q: "Quels documents dois-je fournir pour démarrer ?",
    a: "L'adresse ou la référence cadastrale du terrain, et ce que vous avez déjà : plan du constructeur, esquisse, croquis à main levée, photos du terrain. Pour une conception complète (formule Premium), une description de vos besoins suffit.",
  },
  {
    q: "Mon projet est une extension ou un garage : est-ce un permis ?",
    a: optionDp
      ? `Pas forcément : en dessous de certains seuils, une déclaration préalable suffit. Nous vous le disons au devis et proposons la déclaration préalable à ${formatEuro(optionDp.priceTTC)} TTC à la place du permis.`
      : "Pas forcément : en dessous de certains seuils, une déclaration préalable suffit. Nous vous le disons au devis.",
  },
  {
    q: "Ma maison dépasse 150 m² : pouvez-vous quand même faire le permis ?",
    a: "Oui, sur devis : au-delà de 150 m² de surface de plancher, la loi impose un architecte, et le dossier est signé par notre architecte partenaire inscrit à l'Ordre.",
  },
];

export default function PermisEnLignePage() {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema(),
          faqPageSchema(faqEnLigne),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Permis de construire en ligne", path: "/permis-de-construire-en-ligne" },
          ]),
        ]}
      />

      <section className="bg-forest text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-3">
            <span className="rule" aria-hidden="true" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">100 % en ligne · partout en France</span>
          </div>
          <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[18ch]">
            Votre permis de construire en ligne, <em>sans vous déplacer.</em>
          </h1>
          <p className="mt-8 text-lg sm:text-xl leading-relaxed text-paper/75 max-w-[56ch]">
            Un bureau d&apos;études monte votre dossier de maison individuelle, le dépose sur le guichet numérique de votre
            commune et le suit jusqu&apos;à l&apos;accord. Prix fixe, annoncé avant de commencer.
          </p>

          {/* Les trois réponses qu'on cherche avant tout : délai, prix, démarche. */}
          <dl className="mt-12 grid gap-px bg-paper/15 sm:grid-cols-3 max-w-5xl">
            <div className="bg-forest p-6 sm:pr-8">
              <dt className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">Délai</dt>
              <dd className="mt-3">
                <span className="display text-3xl">{plans[0].delayWorkingDays.replace(" jours ouvrés", "")} à {plans[plans.length - 1].delayWorkingDays.replace(" ouvrés", "")}</span>
                <span className="mt-2 block text-sm text-paper/70">ouvrés pour le dossier, puis 2 mois d&apos;instruction en mairie.</span>
              </dd>
            </div>
            <div className="bg-forest p-6 sm:px-8">
              <dt className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">Prix</dt>
              <dd className="mt-3">
                <span className="display text-3xl">dès {formatEuro(plans[0].priceTTC)}</span>
                <span className="mt-2 block text-sm text-paper/70">TTC, à prix fixe, jusqu&apos;à 149 m². Instruction en mairie gratuite.</span>
              </dd>
            </div>
            <div className="bg-forest p-6 sm:pl-8">
              <dt className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">Démarche</dt>
              <dd className="mt-3">
                <span className="display text-3xl">5 étapes</span>
                <span className="mt-2 block text-sm text-paper/70">du devis sous 4 h ouvrées à l&apos;arrêté de permis.</span>
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <TrackedLink href="/devis" source="en_ligne_hero" className="btn btn-paper">Demander un devis</TrackedLink>
            <Link href="/tarifs" className="btn btn-line-light">Voir les formules</Link>
          </div>
        </div>
      </section>

      <article className="prose-guide mx-auto max-w-3xl px-5 sm:px-8 py-14">
        <h2 id="comment-faire" className="!mt-0 scroll-mt-28">Comment faire son permis de construire en ligne</h2>
        <p>
          Faire son permis « en ligne » recouvre deux choses : le <strong>dépôt dématérialisé</strong> en mairie, désormais
          la règle, et la <strong>préparation du dossier à distance</strong> par un professionnel. Chez nous, les deux se
          font sans rendez-vous physique :
        </p>
        <ol className="list-decimal pl-6 marker:font-bold marker:text-bronze">
          {etapes.map((e) => (
            <li key={e.titre}>
              <strong>{e.titre}.</strong> {e.texte}
            </li>
          ))}
        </ol>

        <h2 id="delai" className="scroll-mt-28">Quel délai pour obtenir son permis de construire ?</h2>
        <ul>
          <li>
            <strong>Préparation du dossier :</strong>{" "}
            {plans.map((p) => `${p.delayWorkingDays} (${p.name})`).join(", ")}, à partir de la réception de vos documents.
          </li>
          <li>
            <strong>Instruction par la mairie :</strong> 2 mois pour une maison individuelle, 3 mois aux abords d&apos;un
            monument historique ou en site protégé.
          </li>
          <li>
            <strong>Pièces complémentaires :</strong> si la mairie en demande dans le premier mois, le délai d&apos;instruction ne
            démarre qu&apos;à leur réception. Un dossier complet dès le dépôt évite ce retard.
          </li>
          <li>
            <strong>Recours des tiers :</strong> une fois le permis accordé et affiché sur le terrain, les voisins ont 2 mois
            pour le contester.
          </li>
        </ul>
        <p>
          Le détail du décompte, des majorations et du permis tacite est dans notre article sur le{" "}
          <Link href="/conseils/delai-instruction-permis-de-construire-permis-tacite">délai d&apos;instruction du permis de construire</Link>.
        </p>

        <h2 id="prix" className="scroll-mt-28">Combien coûte un permis de construire ?</h2>
        <p>
          La mairie instruit gratuitement. Ce qui se paie, c&apos;est le montage du dossier : nos trois formules sont à prix
          fixe, quelle que soit la surface de la maison jusqu&apos;à 149 m².
        </p>
        <table>
          <thead>
            <tr>
              <th>Formule</th>
              <th>Prix TTC</th>
              <th>Dossier prêt en</th>
              <th>Pour qui</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{formatEuro(p.priceTTC)}</td>
                <td>{p.delayWorkingDays}</td>
                <td>{p.promise}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          La formule {complet.name} est pensée pour un permis fait entièrement en ligne : elle comprend le dépôt
          dématérialisé, les réponses à la mairie et le suivi jusqu&apos;à l&apos;accord. Le détail ligne par ligne est sur la{" "}
          <Link href="/tarifs">page des tarifs</Link>, et la comparaison avec un architecte ou un constructeur dans notre
          article <Link href="/conseils/prix-permis-de-construire-maison-individuelle">combien coûte un permis de construire</Link>.
        </p>

        <Cta
          title="Votre prix exact sous 4 h ouvrées."
          text="Décrivez votre projet en 3 minutes : nous lisons le règlement de votre commune et vous répondons avec un prix fixe."
          href="/devis"
          label="Demander un devis"
          secondaryHref="/tarifs"
          secondaryLabel="Comparer les formules"
          source="en_ligne_prix"
        />

        <h2 id="documents" className="scroll-mt-28">Ce qu&apos;il nous faut pour démarrer</h2>
        <ul>
          <li>L&apos;adresse ou la référence cadastrale du terrain.</li>
          <li>Ce que vous avez déjà : plan du constructeur, esquisse, croquis, photos du terrain et des abords.</li>
          <li>La surface envisagée et vos souhaits (nombre de pièces, garage, toiture…).</li>
        </ul>
        <p>
          Vous avez déjà un plan de masse ? <Link href="/plan-de-masse">Envoyez-le</Link> : nous le confrontons au PLU de votre
          commune. Pour tout savoir des pièces exigées, voir le{" "}
          <Link href="/permis-de-construire-maison">guide du permis de construire de maison individuelle</Link>.
        </p>

        <h2 id="faq" className="scroll-mt-28">Questions fréquentes</h2>
        <div className="divide-y divide-stone-2 border-y border-stone-2">
          {faqEnLigne.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 display text-xl leading-tight list-none [&::-webkit-details-marker]:hidden">
                <h3>{item.q}</h3>
                <svg width="20" height="20" viewBox="0 0 24 24" className="mt-1 shrink-0 text-bronze transition-transform group-open:rotate-45" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="pb-6 pr-10 text-[1.02rem] leading-relaxed text-ink-2 max-w-[64ch]">{item.a}</p>
            </details>
          ))}
        </div>

        <Cta
          title="Prêt à lancer votre permis ?"
          text="Devis à prix fixe sous 4 h ouvrées, dossier monté et déposé en ligne, partout en France."
          href="/devis"
          label="Demander un devis"
          source="en_ligne_bas"
        />
      </article>
    </>
  );
}
