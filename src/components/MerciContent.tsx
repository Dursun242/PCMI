import Link from "next/link";
import { plans, site, type PlanId } from "@/config/site";
import { formatEuro } from "@/lib/format";

/**
 * Corps de la page de confirmation, partagé par /devis/merci et par
 * /devis/merci/[type].
 *
 * Le type de conversion voyage dans le CHEMIN, pas dans un paramètre d'URL :
 * Vercel Web Analytics ne compte que des pages, et les événements
 * personnalisés sont réservés aux plans payants. Un chemin distinct par
 * formule rend donc la répartition des demandes lisible sans rien payer.
 */

/** Ce que le prospect peut nous transmettre pour gagner un aller-retour. */
const documents: [string, string][] = [
  ["Le plan de votre terrain", "Plan de bornage du géomètre, ou à défaut l'extrait cadastral (cadastre.gouv.fr)."],
  ["Vos plans, s'il y en a", "Plan du constructeur, esquisse de dessinateur, croquis à main levée : tout est utile."],
  ["Des photos du terrain", "Deux suffisent : une vue proche depuis la rue, une vue large montrant les constructions voisines."],
  ["Le règlement d'urbanisme, si vous l'avez", "Sinon nous le récupérons nous-mêmes sur le Géoportail de l'urbanisme."],
  ["L'attestation RE2020, si elle existe déjà", "Fournie par votre constructeur ou votre thermicien. Sinon elle est incluse dans les formules Complet et Premium."],
];

/** Segments acceptés après /devis/merci. */
export const MERCI_TYPES = [...plans.map((p) => p.id), "conseil", "plan-de-masse", "plans-execution", "etude-thermique"] as const;
export type MerciType = (typeof MERCI_TYPES)[number];

export function isMerciType(v: string): v is MerciType {
  return (MERCI_TYPES as readonly string[]).includes(v);
}

export default function MerciContent({ type }: { type?: MerciType }) {
  const plan = plans.find((p) => p.id === (type as PlanId));
  const viaPlanDeMasse = type === "plan-de-masse";
  const viaExe = type === "plans-execution";
  const viaThermique = type === "etude-thermique";

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <span className="stamp text-2xl w-fit" aria-hidden="true">Reçu</span>
      <h1 className="display mt-8 text-5xl sm:text-6xl">Votre demande est bien arrivée.</h1>
      <p className="lead mt-7">
        Un e-mail de confirmation part à l&apos;instant vers votre boîte de réception — pensez à vérifier vos courriers
        indésirables.{viaPlanDeMasse ? " Votre plan nous est bien parvenu." : ""}
        {viaExe ? " Votre demande porte sur des plans d'exécution : le devis détaille un prix fixe par lot." : ""}
        {viaThermique ? " Votre demande porte sur une étude thermique RE2020 : notre thermicien vous répond avec un prix fixe par prestation." : ""}
        {plan ? ` Votre demande porte sur la formule ${plan.name} (${formatEuro(plan.priceTTC)} TTC, livrée sous ${plan.delayWorkingDays}).` : ""}
      </p>

      <section className="mt-14" aria-labelledby="suite">
        <span className="rule" aria-hidden="true" />
        <h2 id="suite" className="h-section mt-6">Ce qui se passe maintenant</h2>
        <ol className="mt-8 grid gap-7 border-t border-ink pt-8">
          {[
            ["Nous lisons le PLU de votre commune", "Zone, emprise au sol, hauteurs, implantation, aspect des façades, gestion des eaux pluviales, périmètre ABF. C'est ce qui prend le plus de temps, et c'est ce qui rend le prix fiable."],
            ["Vous recevez un devis chiffré sous 4 h ouvrées", "Formule conseillée, prix fixe, délai de livraison et liste exacte des documents à nous transmettre."],
            ["Nous en parlons de vive voix si vous le souhaitez", "Un appel ou une visio pour valider le programme avant de dessiner. Sans engagement."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="numeral text-3xl text-brass w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="display text-2xl leading-tight">{t}</div>
                <div className="mt-1 text-ink-2 leading-relaxed">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="preparer">
        <span className="rule" aria-hidden="true" />
        <h2 id="preparer" className="h-section mt-6">Ce que vous pouvez préparer</h2>
        <p className="mt-5 text-ink-2 leading-relaxed">
          Rien n&apos;est obligatoire à ce stade. Mais si vous avez déjà ces éléments sous la main, répondez simplement à
          l&apos;e-mail de confirmation en les joignant : nous gagnerons un aller-retour.
          {viaPlanDeMasse ? " Votre plan de masse, lui, est déjà entre nos mains." : ""}
        </p>
        <dl className="mt-8 grid gap-5 border-t border-stone-2 pt-6">
          {documents.map(([t, d]) => (
            <div key={t}>
              <dt className="font-bold">{t}</dt>
              <dd className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 border-t border-ink pt-8">
        <p className="display text-3xl">Envie d&apos;aller plus vite ?</p>
        <p className="mt-2 text-ink-2 leading-relaxed">
          La fiche projet complète reprend les rubriques du CERFA 13406 et accepte vos pièces jointes. Remplie
          maintenant, elle nous permet de chiffrer sans échange préalable.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dossier" className="btn btn-ink">Remplir la fiche projet</Link>
          <Link href="/permis-de-construire-maison" className="btn btn-line">Lire le guide du permis</Link>
        </div>
      </section>

      <p className="mt-12 text-sm text-ink-2">
        Une question d&apos;ici là ? Écrivez-nous à{" "}
        <a href={`mailto:${site.email}`} className="text-ink underline decoration-brass underline-offset-4">{site.email}</a>
        {site.phone ? <> ou appelez le {site.phone}.</> : "."}
      </p>
    </div>
  );
}
