import Link from "next/link";
import { site } from "@/config/site";
import { formatFrDate } from "@/lib/format";

/** Signature d'auteur + date de mise à jour, pour les contenus longs (guide, articles). */
export default function AuthorByline({ updatedAt }: { updatedAt: string }) {
  return (
    <p className="mt-6 text-sm text-ink-2">
      Par{" "}
      <Link href="/a-propos" className="font-bold text-ink underline decoration-brass underline-offset-2">
        {site.author}
      </Link>
      , {site.authorRole} — Mis à jour le <time dateTime={updatedAt}>{formatFrDate(updatedAt)}</time>
    </p>
  );
}
