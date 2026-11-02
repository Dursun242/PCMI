import Link from "next/link";
import { CORRESPONDANCE_PIECES, PAGES_PLANCHES } from "@/config/planchesGratuites";

/** Les trois planches gratuites (situation, masse, coupe), chacune vers sa page. */
export default function CartesPlanches({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid gap-px bg-stone-2 sm:grid-cols-3 ${className}`}>
      {CORRESPONDANCE_PIECES.map((c) => {
        const page = PAGES_PLANCHES[c.planche];
        return (
          <li key={c.planche} className="flex flex-col bg-paper p-6 sm:p-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
              {c.pcmi} · {c.pc} · {c.dp}
            </p>
            <h2 className="display mt-3 text-3xl">{page.court}</h2>
            <ul className="mt-5 mb-8 grid gap-2 text-[0.95rem] leading-snug text-ink-2">
              {page.montre.slice(0, 3).map((m) => (
                <li key={m} className="flex gap-3">
                  <span className="mt-2 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
            <Link href={page.path} className="btn btn-line mt-auto !min-h-11 self-start">
              Voir le {page.court.toLowerCase()}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
