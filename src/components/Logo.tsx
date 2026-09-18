import Image from "next/image";

/**
 * Logo ID Maîtrise (fichiers public/brand/logo-black.png et logo-white.png,
 * fond transparent, générés à partir du logo original) suivi de la marque PCMI.
 */
export default function Logo({
  className = "",
  light = false,
  priority = false,
}: {
  className?: string;
  light?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 sm:gap-4 ${light ? "text-paper" : "text-ink"} ${className}`}>
      <Image
        src={light ? "/brand/logo-white.png" : "/brand/logo-black.png"}
        alt="ID Maîtrise — Ingénierie de la construction"
        width={2374}
        height={591}
        sizes="(min-width: 640px) 177px, 129px"
        priority={priority}
        className="h-8 w-auto sm:h-11"
      />
      <span className={`h-8 w-px sm:h-9 ${light ? "bg-brass/50" : "bg-stone-2"}`} aria-hidden="true" />
      <span className="leading-none">
        <span className="display block text-[1.35rem] sm:text-[1.6rem] tracking-[0.04em]">PCMI</span>
        <span className={`block mt-1 text-[0.5rem] sm:text-[0.58rem] font-bold uppercase tracking-[0.14em] ${light ? "text-brass-2" : "text-ink-2"}`}>
          Permis de construire
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          maison individuelle
        </span>
      </span>
    </span>
  );
}
