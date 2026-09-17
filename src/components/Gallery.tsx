import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { photos } from "@/config/photos";

/**
 * Galerie éditoriale. Composant serveur : n'affiche que les photos réellement
 * présentes dans public/photos/ (lancer `npm run photos`), et rien si aucune.
 */
export default function Gallery() {
  const available = photos.filter((p) => existsSync(join(process.cwd(), "public/photos", p.file)));
  if (available.length === 0) return null;

  const credits = available.filter((p) => p.credit);

  return (
    <section className="bg-stone">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[46ch]">
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Des maisons qui méritent un beau dossier</h2>
            <p className="lead mt-6">
              Toit plat, bardage, grandes baies, volumes décalés : les maisons contemporaines demandent une lecture fine du PLU et des façades cotées au millimètre. C&apos;est notre quotidien.
            </p>
          </div>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((p, i) => (
            <li key={p.file} className={`relative overflow-hidden bg-stone-2 h-64 sm:h-80 ${p.wide ? "sm:col-span-2" : ""}`}>
              <Image
                src={`/photos/${p.file}`}
                alt={p.alt}
                fill
                sizes={p.wide ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover"
                priority={i === 0}
              />
              <span className="absolute left-0 bottom-0 m-4 bg-paper/92 px-3 py-1.5 text-xs tracking-[0.06em] text-ink">
                {p.caption}
              </span>
            </li>
          ))}
        </ul>

        {credits.length > 0 && (
          <p className="mt-6 text-xs text-ink-3">
            Photographies :{" "}
            {credits.map((p, i) => (
              <span key={p.file}>
                <a href={p.credit!.url} rel="noopener nofollow" className="underline underline-offset-2 hover:text-ink">
                  {p.credit!.name}
                </a>
                {i < credits.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            (Unsplash). Maisons présentées à titre d&apos;illustration.
          </p>
        )}
      </div>
    </section>
  );
}
