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
  /** En-tête : sur ordinateur (dès 1024 px) seul le logo reste, le menu occupe la place ; « Permis en ligne » s'affiche sur téléphone (sauf sous 360 px, faute de place à côté du menu) et tablette. */
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
      <span className={`h-8 w-px sm:h-9 ${compact ? "max-[359px]:hidden lg:hidden" : ""} ${light ? "bg-brass/50" : "bg-stone-2"}`} aria-hidden="true" />
      <span className={`display whitespace-nowrap text-[1.15rem] leading-none tracking-[0.01em] sm:text-[1.5rem] ${compact ? "max-[359px]:hidden lg:hidden" : ""}`}>
        Permis en ligne
      </span>
    </span>
  );
}
