import Link from "next/link";
import { site } from "@/config/site";

/*
 * TODO(Dursun) : la garantie décennale n'est affirmée nulle part sur le site et
 * `site.legal.insurer` est vide. Tant que l'assureur et le numéro de police ne
 * sont pas confirmés, ce bandeau n'annonce que la responsabilité civile
 * professionnelle, déjà mentionnée sur /tarifs. Dès que vous me transmettez
 * l'attestation, la ligne « Maître d'œuvre assuré » peut préciser la décennale.
 */

const garanties: { titre: string; texte: React.ReactNode }[] = [
  {
    titre: "Maître d'œuvre assuré",
    texte: (
      <>
        Dossier établi par {site.legal.company}, maître d&apos;œuvre assuré en responsabilité civile professionnelle.
      </>
    ),
  },
  {
    titre: "Prix fixe annoncé avant de commencer",
    texte: <>Le montant du devis est celui de la facture. Les seules variations sont les options que vous ajoutez.</>,
  },
  {
    titre: "Dossier conforme, PCMI 1 à 8",
    texte: <>Toutes les pièces réglementaires, à l&apos;échelle, avec le CERFA rempli et le contrôle du PLU de votre commune.</>,
  },
  {
    titre: "Révisions selon la formule",
    texte: (
      <>
        Une série de modifications avec Essentiel, des modifications illimitées jusqu&apos;à l&apos;obtention du permis avec Complet et Premium (même terrain, même programme —{" "}
        <Link href="/cgv" className="underline decoration-brass underline-offset-2">CGV</Link>).
      </>
    ),
  },
];

/** Bandeau de réassurance affiché sur /tarifs et /devis. */
export default function Garanties({ className = "" }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="garanties-titre">
      <span className="rule" aria-hidden="true" />
      <h2 id="garanties-titre" className="display mt-5 text-3xl">
        Ce qui est garanti
      </h2>
      <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {garanties.map((g) => (
          <div key={g.titre} className="border-t border-stone-2 pt-4">
            <dt className="font-bold leading-snug">{g.titre}</dt>
            <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">{g.texte}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
