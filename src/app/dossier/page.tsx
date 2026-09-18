import type { Metadata } from "next";
import Link from "next/link";
import DossierForm from "@/components/DossierForm";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/dossier", {
  title: "Fiche projet complète — votre permis chiffré sans rendez-vous",
  description: "Renseignez votre terrain, votre projet et vos surfaces comme sur le CERFA 13406, joignez vos plans : nous chiffrons votre permis de construire sous 48 h.",
});

export default function DossierPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <span className="rule" aria-hidden="true" />
        <h1 className="display mt-7 text-5xl sm:text-6xl">La fiche projet complète.</h1>
        <p className="lead mt-7 max-w-[42ch]">
          Six étapes, calquées sur les rubriques du CERFA 13406. Une dizaine de minutes si vous avez vos documents sous la main.
        </p>
        <ol className="mt-10 grid gap-3 border-t border-ink pt-6 text-[0.95rem]">
          {["Identité du demandeur", "Le terrain et ses références cadastrales", "Le projet", "Surfaces et dimensions", "Aspect extérieur et raccordements", "Votre attente et vos documents"].map((t, i) => (
            <li key={t} className="flex gap-4">
              <span className="numeral text-xl text-brass w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 border-t border-stone-2 pt-6 text-sm text-ink-2">
          <p>Votre saisie est conservée sur votre appareil : vous pouvez fermer la page et reprendre plus tard.</p>
          <p className="mt-2">
            Vous préférez commencer plus simplement ?{" "}
            <Link href="/contact" className="text-ink underline decoration-brass underline-offset-4">Le formulaire de contact</Link> suffit pour une première question.
          </p>
        </div>
      </div>
      <div className="bg-stone px-6 py-8 sm:px-10 sm:py-12">
        <DossierForm />
      </div>
    </div>
  );
}
