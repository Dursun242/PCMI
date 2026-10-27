import Image from "next/image";
import { site } from "@/config/site";

/** Panneaux de chantier ID Maîtrise (noms des bénéficiaires masqués sur les photos d'origine). */
const PANNEAUX = [
  { photo: "/confiance/panneau-pc-maison-saint-martin-du-manoir.jpg", titre: "Permis de construire · maison", lieu: "Saint-Martin-du-Manoir" },
  { photo: "/confiance/panneau-pc-maison-le-havre.jpg", titre: "Permis de construire", lieu: "Le Havre" },
  { photo: "/confiance/panneau-dp-extension-le-havre.jpg", titre: "Déclaration préalable · extension", lieu: "Le Havre" },
  { photo: "/confiance/panneau-pc-garage.jpg", titre: "Permis de construire · garage", lieu: "Seine-Maritime" },
];

/**
 * /permis-express, juste après le formulaire : la preuve qu'il y a un vrai bureau
 * derrière l'offre (bureau, terrain, panneaux de permis obtenus). Les visiteurs
 * lisent rarement plus bas que la vidéo : la confiance doit venir avant.
 */
export default function ExpressConfiance() {
  return (
    <section data-section="confiance" className="bg-stone" aria-labelledby="confiance">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 id="confiance" className="h-section mt-6 max-w-[18ch]">Un vrai bureau, de vrais permis</h2>
        <p className="lead mt-5 max-w-[56ch]">
          Derrière cette page, {site.parent} : un bureau d&apos;études installé au Havre, {site.address.street}. Nous venons
          voir votre terrain en Normandie quand c&apos;est utile, et nos panneaux sont sur les chantiers de nos clients.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-[1.35fr_1fr]">
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-2">
              <Image
                src="/confiance/bureau-le-havre.jpg"
                alt={`Le bureau d'${site.parent}, ${site.address.street} au Havre`}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink-2">
              <strong className="text-ink">Notre bureau</strong> · {site.address.street}, {site.address.city}
            </figcaption>
          </figure>
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-2">
              <Image
                src="/confiance/terrain-normandie.jpg"
                alt={`Voiture ${site.parent} et panneau de chantier devant un terrain à bâtir en Normandie`}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink-2">
              <strong className="text-ink">Sur le terrain</strong> · avant de dessiner, en Normandie
            </figcaption>
          </figure>
        </div>

        <h3 className="mt-12 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">
          Permis et déclarations obtenus : nos panneaux sur les chantiers
        </h3>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PANNEAUX.map((p) => (
            <li key={p.photo}>
              <figure>
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-2">
                  <Image
                    src={p.photo}
                    alt={`Panneau ${site.parent} : ${p.titre.toLowerCase()}, ${p.lieu}`}
                    fill
                    sizes="(min-width: 1024px) 22vw, 46vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-sm leading-snug">
                  <strong>{p.titre}</strong>
                  <span className="block text-ink-2">{p.lieu}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
