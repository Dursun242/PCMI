import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Garanties from "@/components/Garanties";
import { HUB } from "@/config/planchesGratuites";
import { ORDRE_PLANCHES, PLANCHES, estPlanche } from "@/lib/planche";

/**
 * Remerciement après une demande de plan gratuit, une page par planche :
 * comme pour /devis/merci/{type}, le chemin rend chaque demande lisible dans
 * l'onglet Pages de Vercel Web Analytics et sert d'objectif de conversion.
 * « ?suivi=manuel » : la planche part à la main, sous 24 h ouvrées.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return ORDRE_PLANCHES.map((planche) => ({ planche }));
}

export async function generateMetadata({ params }: { params: Promise<{ planche: string }> }): Promise<Metadata> {
  const { planche } = await params;
  return {
    title: "Merci, votre demande de plan gratuit est bien reçue",
    description: "Confirmation de votre demande de plan gratuit.",
    robots: { index: false, follow: false },
    alternates: { canonical: `${HUB.path}/merci/${planche}` },
  };
}

const ETAPES: [string, string][] = [
  ["Vous recevez votre plan", "Par e-mail, en PDF au format A3, prêt à imprimer. Un e-mail de confirmation vient de partir."],
  ["Vous préparez votre projet", "Place disponible, reculs, pente : le plan vous sert à en parler avec la mairie, un constructeur ou un artisan."],
  ["Nous montons votre permis", "Les pièces PCMI 1 à 8, à prix fixe, déposées en mairie et suivies jusqu'à l'arrêté. Payable en 1, 4 ou 10 fois."],
];

export default async function MerciPlanche({
  params,
  searchParams,
}: {
  params: Promise<{ planche: string }>;
  searchParams: Promise<{ suivi?: string }>;
}) {
  const { planche } = await params;
  if (!estPlanche(planche)) notFound();
  const manuel = (await searchParams).suivi === "manuel";
  const titre = PLANCHES[planche].titre;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div role="status" className="max-w-3xl">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Demande reçue</p>
        <h1 className="display mt-5 text-5xl sm:text-6xl">Merci, c&apos;est parti.</h1>
        <p className="lead mt-7 max-w-[60ch]">
          {manuel
            ? `Votre planche « ${titre} » demande une vérification de notre part : nous la finalisons nous-mêmes et vous l'envoyons par e-mail sous 24 h ouvrées.`
            : `Votre planche « ${titre} » est en cours de dessin. Vous la recevrez par e-mail d'ici quelques minutes ; pensez à regarder dans vos courriers indésirables.`}
        </p>
      </div>

      <ol className="mt-14 grid gap-px border-y border-stone-2 bg-stone-2 sm:grid-cols-3">
        {ETAPES.map(([t, d], i) => (
          <li key={t} className="bg-paper py-7 sm:px-7 sm:first:pl-0">
            <span className="numeral text-sm font-bold tracking-[0.15em] text-bronze" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="display mt-2 text-2xl leading-tight">{t}</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{d}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 max-w-3xl">
        <h2 className="h-section">Un projet sur ce terrain ?</h2>
        <p className="mt-5 max-w-[60ch] leading-relaxed text-ink-2">
          Nous lisons le PLU de votre commune et vous disons ce qui est constructible, puis nous dessinons et déposons
          votre dossier de permis. Prix fixe annoncé avant de commencer.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/tarifs" className="btn btn-ink">Voir les formules</Link>
          <Link href="/contact" className="btn btn-line">Poser une question</Link>
        </div>
      </section>

      <Garanties className="mt-16" />
    </div>
  );
}
