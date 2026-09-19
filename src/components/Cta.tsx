import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";

/** Bloc d'appel à l'action réutilisable dans les contenus longs (guide, articles). */
export default function Cta({
  title,
  text,
  href = "/devis",
  label = "Demander un devis",
  secondaryHref,
  secondaryLabel,
  source = "cta_contenu",
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Emplacement du bloc, pour la mesure (ex. « guide_intro »). */
  source?: string;
}) {
  return (
    <div className="my-12 border-t border-ink pt-8">
      <p className="display text-3xl">{title}</p>
      <p className="mt-2 text-ink-2">{text}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <TrackedLink href={href} source={source} className="btn btn-ink">{label}</TrackedLink>
        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref} className="btn btn-line">{secondaryLabel}</Link>
        )}
      </div>
    </div>
  );
}
