"use client";

import { plans, type PlanId } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { SURFACE_ARCHITECTE, SURFACE_MAX } from "@/lib/formulaFinder";

/**
 * Récapitulatif de la formule choisie, épinglé pendant la saisie du devis.
 * Il ne décide rien : il reflète l'état du formulaire (formule + surface) pour
 * que le prix et le délai restent sous les yeux jusqu'à l'envoi.
 */
export default function DevisRecap({ planId, surface }: { planId: PlanId | "conseil"; surface: string }) {
  const surfaceNum = Number(surface);
  const surfaceValide = surface !== "" && Number.isFinite(surfaceNum) && surfaceNum > 0;
  const horsFormules = surfaceValide && surfaceNum > SURFACE_MAX;
  const plan = plans.find((p) => p.id === planId);

  return (
    <div className="sticky top-[4.5rem] z-20 -mx-6 sm:-mx-10 mb-8 border-b border-stone-2 bg-stone/97 px-6 sm:px-10 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-brass">
            {horsFormules ? "Votre projet" : "Votre formule"}
          </p>

          {horsFormules ? (
            <>
              <p className="display mt-1 text-2xl sm:text-3xl leading-tight">Sur devis</p>
              <p className="mt-1 text-sm text-ink-2">
                {surfaceNum} m² de surface de plancher — au-delà de {SURFACE_MAX} m², le prix est établi après lecture du
                PLU de votre commune.
              </p>
            </>
          ) : plan ? (
            <>
              <p className="display mt-1 text-2xl sm:text-3xl leading-tight">{plan.name}</p>
              <p className="mt-1 text-sm text-ink-2">
                <span className="numeral text-ink">{formatEuro(plan.priceTTC)} TTC</span> · livré sous{" "}
                {plan.delayWorkingDays} · jusqu&apos;à {SURFACE_MAX} m²
              </p>
            </>
          ) : (
            <>
              <p className="display mt-1 text-2xl sm:text-3xl leading-tight">Nous vous conseillons</p>
              <p className="mt-1 text-sm text-ink-2">
                À partir de <span className="numeral text-ink">{formatEuro(plans[0].priceTTC)} TTC</span> · jusqu&apos;à{" "}
                {SURFACE_MAX} m² · devis sous 4 h ouvrées
              </p>
            </>
          )}
        </div>

        <a
          href="#formule"
          className="shrink-0 self-center text-sm text-ink-2 underline decoration-brass underline-offset-4 hover:text-ink"
        >
          Changer
        </a>
      </div>

      {/* Points clés : visibles seulement quand la place le permet. */}
      {!horsFormules && plan && (
        <ul className="mt-3 hidden gap-x-6 gap-y-1 text-sm text-ink-2 sm:flex sm:flex-wrap">
          {plan.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-baseline gap-2">
              <span className="h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/*
        TODO(Dursun) : confirmer cette formulation. Elle reprend mot pour mot la
        promesse déjà publiée sur /tarifs (« nous montons le dossier avec notre
        architecte partenaire »). Si la prise en charge se passe autrement —
        mise en relation, honoraires de l'architecte facturés à part — il faut
        le dire ici, c'est le moment où le prospect se pose la question.
      */}
      {horsFormules && (
        <p className="mt-3 border-l-2 border-brass pl-3 text-sm leading-relaxed text-ink-2">
          Rien n&apos;est bloqué : nous traitons régulièrement ces projets.
          {surfaceNum >= SURFACE_ARCHITECTE ? (
            <>
              {" "}
              Au-delà de {SURFACE_ARCHITECTE} m² de surface de plancher, le recours à un architecte est légalement
              obligatoire (code de l&apos;urbanisme, art. L.431-3) : nous montons le dossier avec notre architecte
              partenaire et vous n&apos;avez pas à le chercher vous-même.
            </>
          ) : (
            " Décrivez votre projet ci-dessous : vous recevez un devis chiffré sous 4 h ouvrées."
          )}
        </p>
      )}
    </div>
  );
}
