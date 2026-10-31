import { ht, lancement, type Plan } from "@/config/site";
import { formatEuro } from "@/lib/format";
import TrackedLink from "@/components/TrackedLink";

/**
 * Colonne de formule : pas de carte, un filet haut. La formule mise en avant
 * porte un filet laiton et un fond pierre.
 */
export default function PlanCard({ plan, compact = false }: { plan: Plan; compact?: boolean }) {
  const hi = plan.highlight;
  return (
    <article
      className={`relative flex flex-col px-6 py-8 sm:px-8 sm:py-10 border-t ${
        hi ? "border-brass bg-stone" : "border-ink"
      }`}
    >
      {hi && (
        <span className="absolute -top-3 left-6 sm:left-8 bg-paper px-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-bronze">
          Recommandée
        </span>
      )}
      <h3 className="display text-3xl">{plan.name}</h3>
      <p className="mt-2 text-ink-2">{plan.promise}</p>

      {plan.regularPriceTTC && (
        <p className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-bronze">{lancement.nom}</p>
      )}
      <div className={`${plan.regularPriceTTC ? "mt-2" : "mt-7"} flex flex-wrap items-baseline gap-x-3 gap-y-1`}>
        <span className="numeral text-5xl">{formatEuro(plan.priceTTC)}</span>
        <span className="text-xs font-bold tracking-[0.1em] uppercase text-ink-2">TTC</span>
        {plan.regularPriceTTC && (
          <span className="text-lg text-ink-3 line-through decoration-1" aria-label={`au lieu de ${formatEuro(plan.regularPriceTTC)}`}>
            {formatEuro(plan.regularPriceTTC)}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-2">
        soit {formatEuro(ht(plan.priceTTC))} HT. Livré sous {plan.delayWorkingDays}.
      </p>
      <p className="mt-1 text-sm text-ink-2">
        Pour démarrer : acompte de {formatEuro(Math.round(plan.priceTTC * 0.4))}, le solde à la remise du dossier.
      </p>

      {!compact && <p className="mt-6 text-[0.98rem] leading-relaxed">{plan.forWho}</p>}

      <ul className="mt-8 grid gap-3 text-[0.95rem]">
        {plan.features.map((f, i) => {
          const isCarry = f.startsWith("Tout ");
          return (
            <li key={f} className={`flex gap-3 ${isCarry ? "font-bold" : ""}`}>
              <span className="mt-[0.7em] h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
              <span>
                {f}
                {isCarry && i === 0 ? ", et en plus :" : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {!compact && plan.notIncluded && plan.notIncluded.length > 0 && (
        <ul className="mt-5 grid gap-1.5 text-sm text-ink-3">
          {plan.notIncluded.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="mt-[0.7em] h-px w-3 shrink-0 bg-ink-3" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-9">
        <TrackedLink
          href={`/commander?formule=${plan.id}`}
          source={compact ? "plan_card_accueil" : "plan_card_tarifs"}
          formule={plan.id}
          className={`btn w-full ${hi ? "btn-ink" : "btn-line"}`}
        >
          Choisir {plan.name}
        </TrackedLink>
      </div>
    </article>
  );
}
