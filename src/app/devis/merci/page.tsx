import type { Metadata } from "next";
import Link from "next/link";
import { plans, site, type PlanId } from "@/config/site";
import { formatEuro } from "@/lib/format";

/**
 * Confirmation d'envoi du formulaire de devis.
 * URL dédiée : c'est elle qui rend la conversion mesurable et permet au
 * prospect de revenir sur la page sans renvoyer sa demande.
 */
export const metadata: Metadata = {
  title: "Votre demande est bien reçue",
  description: "Confirmation de votre demande de devis de permis de construire.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/devis/merci" },
};

const documents = [
  ["Le plan de votre terrain", "Plan de bornage du géomètre, ou à défaut l'extrait cadastral (cadastre.gouv.fr)."],
  ["Vos plans, s'il y en a", "Plan du constructeur, esquisse de dessinateur, croquis à main levée : tout est utile."],
  ["Des photos du terrain", "Deux suffisent : une vue proche depuis la rue, une vue large montrant les constructions voisines."],
  ["Le règlement d'urbanisme, si vous l'avez", "Sinon nous le récupérons nous-mêmes sur le Géoportail de l'urbanisme."],
  ["L'attestation RE2020, si elle existe déjà", "Fournie par votre constructeur ou votre thermicien. Sinon elle est incluse dans les formules Complet et Premium."],
];

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string; source?: string }>;
}) {
  const { formule, source } = await searchParams;
  const plan = plans.find((p) => p.id === (formule as PlanId));
  // Le formulaire /plan-de-masse aboutit ici : son envoi contenait déjà un plan.
  const viaPlanDeMasse = source === "plan-de-masse";

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <span className="stamp text-2xl w-fit" aria-hidden="true">Reçu</span>
      <h1 className="display mt-8 text-5xl sm:text-6xl">Votre demande est bien arrivée.</h1>
      <p className="lead mt-7">
        Un e-mail de confirmation part à l&apos;instant vers votre boîte de réception — pensez à vérifier vos courriers
        indésirables. {viaPlanDeMasse ? "Votre plan nous est bien parvenu." : ""}
        {plan ? ` Votre demande porte sur la formule ${plan.name} (${formatEuro(plan.priceTTC)} TTC, livrée sous ${plan.delayWorkingDays}).` : ""}
      </p>

      <section className="mt-14" aria-labelledby="suite">
        <span className="rule" aria-hidden="true" />
        <h2 id="suite" className="h-section mt-6">Ce qui se passe maintenant</h2>
        <ol className="mt-8 grid gap-7 border-t border-ink pt-8">
          {[
            ["Nous lisons le PLU de votre commune", "Zone, emprise au sol, hauteurs, implantation, aspect des façades, gestion des eaux pluviales, périmètre ABF. C'est ce qui prend le plus de temps, et c'est ce qui rend le prix fiable."],
            ["Vous recevez un devis chiffré sous 48 h ouvrées", "Formule conseillée, prix fixe, délai de livraison et liste exacte des documents à nous transmettre."],
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
