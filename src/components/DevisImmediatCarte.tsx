import Link from "next/link";
import type { Plan } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { formatCentimes, mensualites } from "@/lib/commande";
import { lienCommandeImmediate, mentionOffreLancement } from "@/lib/devisImmediat";
import { SURFACE_MAX } from "@/lib/formulaFinder";
import TrackedLink from "./TrackedLink";

/**
 * Le devis affiché dès l'envoi du formulaire, pour une maison neuve jusqu'à
 * SURFACE_MAX m² dont la formule est choisie : les prix sont fixes, il n'y a
 * rien à attendre. La lecture du PLU se fait avant le lancement du dossier.
 */
export default function DevisImmediatCarte({ plan, surface }: { plan: Plan; surface: string }) {
  const etalement = mensualites(plan.priceTTC)[0];
  const offre = mentionOffreLancement(plan);
  const prixBarre = offre ? plan.regularPriceTTC : undefined;

  return (
    <section className="mt-12 border border-ink bg-paper p-6 sm:p-10" aria-labelledby="devis-immediat">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bronze">Votre devis immédiat</p>
      <h2 id="devis-immediat" className="display mt-3 text-4xl sm:text-5xl">Formule {plan.name}</h2>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-3">
        <span className="numeral text-5xl">{formatEuro(plan.priceTTC)}</span>
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2">TTC</span>
        {prixBarre && <s className="numeral text-xl text-ink-3">{formatEuro(prixBarre)}</s>}
      </p>
      {etalement && (
        <p className="mt-2 text-ink-2">
          ou {etalement.nombre}&nbsp;×&nbsp;{formatCentimes(etalement.montantCentimes)} sans frais
        </p>
      )}
      {offre && <p className="mt-3 border-l-2 border-brass pl-4 text-sm text-ink">{offre}</p>}

      <dl className="mt-8 grid gap-4 border-t border-stone-2 pt-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-2">Votre projet</dt>
          <dd className="font-bold">Maison neuve, {Math.round(Number(surface))}&nbsp;m² de surface de plancher</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Délai de livraison du dossier</dt>
          <dd className="font-bold">{plan.delayWorkingDays}</dd>
        </div>
      </dl>

      <ul className="mt-6 grid gap-2 text-[0.95rem]">
        {plan.features.map((f) => (
          <li key={f} className="flex items-baseline gap-3">
            <span className="h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm leading-relaxed text-ink-2">
        Prix fixe pour une maison jusqu&apos;à {SURFACE_MAX}&nbsp;m², hors options que vous choisiriez d&apos;ajouter. Nous
        lisons le règlement d&apos;urbanisme de votre commune avant de lancer le dossier : s&apos;il ne permet pas le
        permis, rien n&apos;est facturé.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <TrackedLink href={lienCommandeImmediate(plan.id, surface)} source="merci_devis_immediat" formule={plan.id} className="btn btn-ink">
          Commander au prix de {formatEuro(plan.priceTTC)}
        </TrackedLink>
        <Link href="/tarifs" className="text-sm underline decoration-brass underline-offset-4">
          Comparer les trois formules
        </Link>
      </div>
    </section>
  );
}
