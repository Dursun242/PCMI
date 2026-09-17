import Link from "next/link";
import { ht, type Plan } from "@/config/site";

export function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

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
        <span className="absolute -top-3 left-6 sm:left-8 bg-paper px-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brass">
          La plus choisie
        </span>
      )}
      <h3 className="display text-3xl">{plan.name}</h3>
      <p className="mt-2 text-ink-2">{plan.promise}</p>

      <div className="mt-7 flex items-baseline gap-2">
        <span className="numeral text-5xl">{formatEuro(plan.priceTTC)}</span>
        <span className="text-xs font-bold tracking-[0.1em] uppercase text-ink-2">TTC</span>
      </div>
      <p className="mt-1 text-sm text-ink-2">
        soit {formatEuro(ht(plan.priceTTC))} HT. Livré sous {plan.delayWorkingDays}.
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
        <Link href={`/devis?formule=${plan.id}`} className={`btn w-full ${hi ? "btn-ink" : "btn-line"}`}>
          Choisir {plan.name}
        </Link>
      </div>
    </article>
  );
}
