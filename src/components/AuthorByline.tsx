import { site } from "@/config/site";
import { formatFrDate } from "@/lib/format";

/** Signature d'auteur + date de mise à jour, pour les contenus longs (guide, articles). */
export default function AuthorByline({ updatedAt }: { updatedAt: string }) {
  return (
    <p className="mt-6 text-sm text-ink-2">
      Par {site.author}, maître d&apos;œuvre — Mis à jour le <time dateTime={updatedAt}>{formatFrDate(updatedAt)}</time>
    </p>
  );
}
