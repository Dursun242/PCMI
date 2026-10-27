import Image from "next/image";
import ChronoPermis from "@/components/ChronoPermis";
import { site } from "@/config/site";

/** Fiche Google d'ID Maîtrise (lien du site id-maitrise.com). */
const AVIS_GOOGLE = "https://g.co/kgs/9n829AX";

/** Avis Google, recopiés mot pour mot (repris du site d'ID Maîtrise) ; note et nombre au moment de la reprise. */
const NOTE = { moyenne: "5,0", nombre: 7 };
const AVIS = [
  {
    texte:
      "Une expérience exceptionnelle ! Dursun Özkan est une personne d'un grand professionnalisme, toujours à l'écoute et soucieuse de la satisfaction de ses clients. Son travail est impeccable, réalisé avec soin et passion.",
    auteur: "A. Ö.",
    coupe: true,
  },
  { texte: "Monsieur Ozkan est un professionnel très compétent. Je recommande sans hésitation.", auteur: "Eda G.", coupe: false },
  { texte: "Mr Ozkan sait se rendre disponible et il est de très bon conseil, je recommande.", auteur: "Antoine O.", coupe: false },
];

/** Panneaux de chantier ID Maîtrise, maisons d'abord (noms des bénéficiaires masqués sur les photos d'origine). */
const PANNEAUX = [
  { photo: "/confiance/panneau-maison-triquerville.jpg", titre: "Permis · maison de 100 m²", lieu: "Triquerville, 2026" },
  { photo: "/confiance/panneau-maison-saint-aubin-routot.jpg", titre: "Permis · maison", lieu: "Saint-Aubin-Routot, 2025" },
  { photo: "/confiance/panneau-quatre-maisons-le-havre.jpg", titre: "Permis · quatre maisons", lieu: "Le Havre, 2024" },
  { photo: "/confiance/panneau-pc-maison-saint-martin-du-manoir.jpg", titre: "Permis · maison", lieu: "Saint-Martin-du-Manoir, 2022" },
  { photo: "/confiance/panneau-pc-le-havre.jpg", titre: "Permis de construire", lieu: "Le Havre" },
  { photo: "/confiance/panneau-extension-garage-oudalle.jpg", titre: "Extension et garage", lieu: "Oudalle" },
];

/**
 * /permis-express, juste après le formulaire : qui fait le permis (portrait, avis
 * Google), comment (chronologie, du PLU à l'accord), où (bureau, voiture) et la
 * preuve de permis obtenus (panneaux). Les visiteurs lisent rarement plus bas que
 * la vidéo : la confiance doit venir avant.
 */
export default function ExpressConfiance() {
  return (
    <section data-section="confiance" className="bg-stone" aria-labelledby="confiance">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 id="confiance" className="h-section mt-6 max-w-[18ch]">Un vrai bureau, de vrais permis</h2>

        <div className="mt-10 grid gap-8 md:grid-cols-[0.75fr_1.25fr] md:items-start">
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-2">
              <Image
                src="/confiance/dursun-ozkan.jpg"
                alt={`Dursun Ozkan, fondateur et gérant d'${site.parent}, au bureau du Havre`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink-2">
              <strong className="text-ink">Dursun Ozkan</strong>, fondateur et gérant. Il suit personnellement chaque dossier
              avec ses dessinateurs, de la lecture du PLU jusqu&apos;à l&apos;accord du permis.
            </figcaption>
          </figure>

          <div>
            <p className="lead max-w-[52ch]">
              {site.parent}, bureau d&apos;études créé en 2022 au Havre, {site.address.street}. Nous venons voir votre
              terrain en Normandie quand c&apos;est utile, et nos panneaux sont sur les chantiers de nos clients.
            </p>

            <a
              href={AVIS_GOOGLE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 border-b border-ink pb-2"
            >
              <span className="display text-4xl leading-none">{NOTE.moyenne}</span>
              <span aria-hidden="true" className="text-xl tracking-[0.15em] text-bronze">★★★★★</span>
              <span className="text-sm text-ink-2 underline decoration-brass underline-offset-4">{NOTE.nombre} avis sur Google</span>
            </a>

            <ul className="mt-6 grid gap-5">
              {AVIS.map((a) => (
                <li key={a.auteur}>
                  <blockquote className="leading-relaxed">
                    « {a.texte}
                    {a.coupe ? " […]" : ""} »
                  </blockquote>
                  <p className="mt-1 text-sm text-ink-2">
                    <strong className="text-ink">{a.auteur}</strong> · avis Google
                  </p>
                </li>
              ))}
            </ul>

            <ul className="mt-8 grid gap-2 border-t border-stone-2 pt-5 text-sm text-ink-2 sm:grid-cols-3">
              <li><strong className="block text-ink">Depuis 2022</strong>au Havre</li>
              <li><strong className="block text-ink">Assurance décennale</strong>attestation jointe au contrat</li>
              <li><strong className="block text-ink">{site.legal.company}</strong>RCS Le Havre</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-[0.75fr_1.25fr]">
          <h3 className="display text-3xl leading-tight sm:text-4xl md:sticky md:top-28 md:self-start">Votre permis, du PLU à l&apos;accord</h3>
          <ChronoPermis />
        </div>

        <div className="mt-14 grid gap-3 md:grid-cols-[1.35fr_1fr]">
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
              <strong className="text-ink">Le bureau</strong> · {site.address.street}, {site.address.city}
            </figcaption>
          </figure>
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-2">
              <Image
                src="/confiance/voiture-agence.jpg"
                alt={`La voiture d'${site.parent}`}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink-2">
              <strong className="text-ink">Sur le terrain</strong> · pour venir voir votre parcelle et vos chantiers
            </figcaption>
          </figure>
        </div>

        <h3 className="mt-12 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">
          Permis et déclarations obtenus : nos panneaux sur les chantiers
        </h3>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {PANNEAUX.map((p) => (
            <li key={p.photo}>
              <figure>
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-2">
                  <Image
                    src={p.photo}
                    alt={`Panneau ${site.parent} : ${p.titre.toLowerCase()}, ${p.lieu}`}
                    fill
                    sizes="(min-width: 1024px) 15vw, (min-width: 768px) 30vw, 46vw"
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
