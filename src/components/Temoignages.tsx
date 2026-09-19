import { site } from "@/config/site";
import JsonLd from "@/components/JsonLd";
import data from "../../content/temoignages.json";

/**
 * Témoignages clients.
 *
 * TODO(Dursun) : le composant est prêt mais ne rend RIEN tant que
 * `content/temoignages.json` ne contient pas de témoignage réel et complet.
 * Les entrées incomplètes sont ignorées volontairement : aucun avis ne doit
 * être affiché — ni émis en schéma `Review` — sans accord du client.
 */

export interface Temoignage {
  auteur: string;
  commune: string;
  /** Date ISO (YYYY-MM-DD). */
  date: string;
  /** Note sur 5. */
  note: number;
  texte: string;
  /** Nom de la formule réalisée, facultatif. */
  formule?: string;
}

function estComplet(t: Partial<Temoignage>): t is Temoignage {
  return Boolean(
    t.auteur?.trim() &&
      t.commune?.trim() &&
      t.date?.trim() &&
      t.texte?.trim() &&
      typeof t.note === "number" &&
      t.note > 0 &&
      t.note <= 5,
  );
}

export function getTemoignages(): Temoignage[] {
  const brut = (data as { temoignages?: Partial<Temoignage>[] }).temoignages ?? [];
  return brut.filter(estComplet);
}

function reviewSchema(t: Temoignage) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Organization", "@id": `${site.url}/#organization`, name: site.name },
    author: { "@type": "Person", name: t.auteur },
    datePublished: t.date,
    reviewRating: { "@type": "Rating", ratingValue: t.note, bestRating: 5, worstRating: 1 },
    reviewBody: t.texte,
    inLanguage: "fr-FR",
  };
}

export default function Temoignages({ className = "" }: { className?: string }) {
  const temoignages = getTemoignages();
  if (temoignages.length === 0) return null;

  return (
    <section className={className} aria-labelledby="temoignages-titre">
      <JsonLd data={temoignages.map(reviewSchema)} />
      <span className="rule" aria-hidden="true" />
      <h2 id="temoignages-titre" className="h-section mt-6">
        Ce qu&apos;en disent nos clients
      </h2>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {temoignages.map((t) => (
          <li key={`${t.auteur}-${t.date}`} className="border-t border-ink pt-5">
            <p className="text-[1.02rem] leading-relaxed">« {t.texte} »</p>
            <p className="mt-4 text-sm text-ink-2">
              {t.auteur}, {t.commune}
              {t.formule ? ` · formule ${t.formule}` : ""} ·{" "}
              <time dateTime={t.date}>{new Date(t.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
