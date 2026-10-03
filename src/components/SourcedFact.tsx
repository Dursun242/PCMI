import type { Fait } from "@/config/normandie";

type Props = {
  titre?: string;
  fait: Fait;
};

/** Un fait réglementaire local, avec sa source citée juste en dessous. */
export default function SourcedFact({ titre, fait }: Props) {
  return (
    <div className="border-t border-stone-2 pt-4">
      {titre && <p className="font-bold leading-snug">{titre}</p>}
      <p className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-2">{fait.texte}</p>
      <p className="mt-1.5 text-xs text-ink-2">
        Source :{" "}
        <a href={fait.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-brass underline-offset-2 hover:text-ink">
          {fait.source.label}
        </a>
      </p>
    </div>
  );
}
