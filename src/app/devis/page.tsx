import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import DevisForm from "@/components/DevisForm";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/devis", {
  title: "Demander un devis de permis de construire",
  description:
    "Décrivez votre projet de maison en 3 minutes et recevez sous 48 h un devis chiffré à prix fixe pour votre permis de construire, partout en France.",
  robots: { index: true, follow: true },
});

export default function DevisPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
      <div>
        <span className="rule" aria-hidden="true" />
        <h1 className="display mt-7 text-5xl sm:text-6xl">Votre devis sous 48 h.</h1>
        <p className="lead mt-7 max-w-[42ch]">
          Trois minutes suffisent. Nous consultons le règlement d&apos;urbanisme de votre commune avant de vous répondre, pour que le prix annoncé soit le bon.
        </p>
        <ol className="mt-12 grid gap-7 border-t border-ink pt-8">
          {[
            ["Vous décrivez le projet", "Terrain, surface, stade d'avancement. Pas besoin de plans définitifs."],
            ["Nous vérifions le PLU", "Zone, hauteurs, implantation, aspect, eaux pluviales, ABF."],
            ["Vous recevez le devis", "Formule conseillée, prix fixe, délai de livraison et liste des documents à nous transmettre."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="numeral text-3xl text-brass w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="display text-2xl leading-tight">{t}</div>
                <div className="mt-1 text-ink-2 text-[0.95rem]">{d}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 border-t border-stone-2 pt-6">
          <p className="display text-2xl">Vous avez déjà vos documents ?</p>
          <p className="mt-1 text-sm text-ink-2">La fiche projet complète (rubriques du CERFA 13406, pièces jointes) nous permet de chiffrer sans échange préalable.</p>
          <Link href="/dossier" className="btn btn-line mt-4 !min-h-11">Remplir la fiche complète</Link>
        </div>
        <p className="mt-8 text-sm text-ink-2">
          Vous préférez écrire directement ?{" "}
          <Link href="/contact" className="text-ink underline decoration-brass underline-offset-4">
            Contactez-nous
          </Link>
        </p>
      </div>

      <div className="bg-stone px-6 py-8 sm:px-10 sm:py-12">
        <Suspense fallback={null}>
          <DevisForm />
        </Suspense>
      </div>
    </div>
  );
}
