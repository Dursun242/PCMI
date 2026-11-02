import Link from "next/link";
import { regions } from "@/config/territoires";
import { departementPath, departementsDe, regionPath } from "@/lib/territoires";

/** Toutes les régions de métropole, chacune avec ses départements : maillage interne des pages locales. */
export default function TerritoiresListe({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {regions.map((r) => (
        <li key={r.slug} className="border-t border-stone-2 pt-4">
          <Link href={regionPath(r)} className="display text-2xl hover:text-bronze">
            {r.nom}
          </Link>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.95rem] text-ink-2">
            {departementsDe(r).map((d) => (
              <li key={d.code}>
                <Link href={departementPath(d)} className="hover:text-ink hover:underline decoration-brass underline-offset-4">
                  {d.nom} ({d.code})
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
