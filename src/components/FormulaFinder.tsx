"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { plans } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { recommend, type Answers, type Contraintes } from "@/lib/formulaFinder";
import { surfaceBucket, trackEvent } from "@/lib/analytics";

const contraintesOptions: [Contraintes, string][] = [
  ["non", "Non, terrain ordinaire"],
  ["oui", "Oui"],
  ["je-ne-sais-pas", "Je ne sais pas"],
];

function Question({ n, titre, aide, children }: { n: number; titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <fieldset className="field border-t border-stone-2 pt-5">
      <legend className="flex items-baseline gap-2">
        <span className="numeral text-brass not-italic">{String(n).padStart(2, "0")}</span>
        <span>{titre}</span>
      </legend>
      {aide && <p className="hint mt-1 normal-case tracking-normal">{aide}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Choix({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="opt flex items-center gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer min-h-12">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-ink h-4 w-4" />
      <span>{children}</span>
    </label>
  );
}

/**
 * « Quelle formule pour mon projet ? » — trois questions, une recommandation.
 * Toute la règle de décision vit dans src/lib/formulaFinder.ts (testée) ;
 * ce composant ne fait que la saisie et l'affichage.
 */
export default function FormulaFinder({ className = "" }: { className?: string }) {
  const [answers, setAnswers] = useState<Answers>({ surface: null, contraintes: null, rendus3dEtRe2020: null });
  const result = recommend(answers);
  const dernierSuivi = useRef<string | null>(null);

  useEffect(() => {
    if (!result) return;
    const cle = `${result.planId ?? "sur-devis"}|${surfaceBucket(answers.surface)}`;
    if (dernierSuivi.current === cle) return;
    dernierSuivi.current = cle;
    trackEvent("formula_finder_result", {
      formule: result.planId ?? "sur-devis",
      surface_bucket: surfaceBucket(answers.surface),
    });
  }, [result, answers.surface]);

  const plan = result?.planId ? plans.find((p) => p.id === result.planId) : undefined;

  return (
    <section className={className} aria-labelledby="finder-titre">
      <span className="rule" aria-hidden="true" />
      <h2 id="finder-titre" className="h-section mt-6">
        Quelle formule pour mon projet ?
      </h2>
      <p className="lead mt-4 max-w-[54ch]">
        Trois questions, une réponse argumentée. Aucune donnée n&apos;est enregistrée : la recommandation est calculée
        dans votre navigateur.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-7">
          <Question n={1} titre="Surface de plancher approximative" aide="En m². Une estimation suffit.">
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              placeholder="ex. 120"
              aria-label="Surface de plancher en mètres carrés"
              className="min-h-12"
              value={answers.surface ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setAnswers((a) => ({ ...a, surface: v === "" ? null : Number(v) }));
              }}
            />
          </Question>

          <Question
            n={2}
            titre="PLU particulier ou secteur protégé ?"
            aide="Site classé, abords d'un monument historique, avis de l'Architecte des Bâtiments de France, règles d'aspect strictes."
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {contraintesOptions.map(([v, l]) => (
                <Choix
                  key={v}
                  name="finder-contraintes"
                  value={v}
                  checked={answers.contraintes === v}
                  onChange={() => setAnswers((a) => ({ ...a, contraintes: v }))}
                >
                  {l}
                </Choix>
              ))}
            </div>
          </Question>

          <Question
            n={3}
            titre="Rendus 3D réalistes et attestation RE2020 ?"
            aide="L'attestation RE2020 est obligatoire au dépôt pour une construction neuve : répondez « non » seulement si votre constructeur ou votre thermicien vous la fournit."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                [true, "Oui, à votre charge"],
                [false, "Non, je les ai déjà"],
              ].map(([v, l]) => (
                <Choix
                  key={String(v)}
                  name="finder-rendus"
                  value={String(v)}
                  checked={answers.rendus3dEtRe2020 === v}
                  onChange={() => setAnswers((a) => ({ ...a, rendus3dEtRe2020: v as boolean }))}
                >
                  {l as string}
                </Choix>
              ))}
            </div>
          </Question>
        </div>

        <div className="lg:border-l lg:border-stone-2 lg:pl-16" aria-live="polite">
          {!result ? (
            <div className="h-full border-t border-stone-2 pt-5 lg:border-t-0 lg:pt-0">
              <p className="text-ink-2">
                Répondez aux trois questions : nous affichons ici la formule adaptée et la raison de ce choix.
              </p>
            </div>
          ) : (
            <div className="border-t border-ink pt-5 lg:border-t-0 lg:pt-0">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brass">Formule conseillée</p>
              <p className="display mt-3 text-4xl">{result.planName}</p>
              {plan ? (
                <p className="mt-2">
                  <span className="numeral text-2xl">{formatEuro(plan.priceTTC)}</span>{" "}
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2">TTC</span>
                  <span className="text-ink-2"> · livré sous {plan.delayWorkingDays}</span>
                </p>
              ) : (
                <p className="mt-2 text-ink-2">Prix établi après lecture du PLU de votre commune, sous 48 h.</p>
              )}
              <div className="mt-5 grid gap-3 text-[0.98rem] leading-relaxed">
                {result.rationale.map((phrase) => (
                  <p key={phrase}>{phrase}</p>
                ))}
              </div>
              <Link
                href={result.href}
                className="btn btn-ink mt-7 w-full sm:w-auto"
                onClick={() =>
                  trackEvent("cta_click", {
                    source: "formula_finder",
                    formule: result.planId ?? "sur-devis",
                  })
                }
              >
                {result.planId ? `Demander un devis ${result.planName}` : "Demander un devis sur mesure"}
              </Link>
              <p className="mt-4 text-sm text-ink-2">
                Cette recommandation n&apos;engage à rien : vous pourrez changer de formule dans le formulaire, et nous
                vous le dirons si une autre est plus juste pour votre projet.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
