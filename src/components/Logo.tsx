import Image from "next/image";

/**
 * Logo ID Maîtrise (fichiers public/brand/logo-black.png et logo-white.png,
 * fond transparent, générés à partir du logo original) suivi de « Permis en ligne ».
 */
export default function Logo({
  className = "",
  light = false,
  priority = false,
  compact = false,
}: {
  className?: string;
  light?: boolean;
  priority?: boolean;
  /** En-tête : sur ordinateur (dès 1024 px) seul le logo reste, le menu occupe la place ; « Permis en ligne » s'affiche sur téléphone et tablette. */
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-3 sm:gap-4 ${light ? "text-paper" : "text-ink"} ${className}`}>
      <Image
        src={light ? "/brand/logo-white.png" : "/brand/logo-black.png"}
        alt="ID Maîtrise — Ingénierie de la construction"
        width={2374}
        height={591}
        sizes="(min-width: 640px) 177px, 129px"
        priority={priority}
        className="h-8 w-auto sm:h-11"
      />
      <span className={`h-8 w-px sm:h-9 ${compact ? "lg:hidden" : ""} ${light ? "bg-brass/50" : "bg-stone-2"}`} aria-hidden="true" />
      <span className={`leading-none ${compact ? "lg:hidden" : ""}`}>
        <span className="display block whitespace-nowrap text-[1.15rem] sm:text-[1.5rem] tracking-[0.01em]">Permis en ligne</span>
        <span className={`mt-1 text-[0.5rem] sm:text-[0.58rem] font-bold uppercase tracking-[0.14em] whitespace-nowrap ${compact ? "block lg:hidden" : "block"} ${light ? "text-brass-2" : "text-ink-2"}`}>
          Maison individuelle
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          prix fixe
        </span>
      </span>
    </span>
  );
}
