import Image from "next/image";
import { plans } from "@/config/site";
import type { Realisation } from "@data/realisations";

const planName = (id: Realisation["formule"]) => plans.find((p) => p.id === id)?.name ?? id;

/**
 * Galerie de réalisations réelles. Remplace <Gallery /> (photos d'illustration
 * Unsplash) dès que data/realisations.ts contient 3 entrées ou plus.
 */
export default function RealisationsGallery({ items }: { items: Realisation[] }) {
  return (
    <section className="bg-stone">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[46ch]">
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Des permis obtenus, partout en France</h2>
            <p className="lead mt-6">Quelques projets récents, avec la formule utilisée et la surface de plancher déposée.</p>
          </div>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => (
            <li key={r.titre} className="relative overflow-hidden bg-stone-2 h-64 sm:h-80">
              {r.images[0] && (
                <Image
                  src={`/realisations/${r.images[0]}`}
                  alt={r.titre}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              )}
              <span className="absolute left-0 bottom-0 m-4 bg-paper/92 px-3 py-1.5 text-xs tracking-[0.06em] text-ink">
                {r.commune} ({r.departement}) — {r.surface} m² — {planName(r.formule)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
