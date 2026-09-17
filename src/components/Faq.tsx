import { faq } from "@/config/site";

export default function Faq({ items = faq }: { items?: typeof faq }) {
  return (
    <div className="divide-y divide-stone-2 border-y border-stone-2">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer items-start justify-between gap-6 py-6 display text-[1.45rem] leading-tight list-none [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              className="mt-1 shrink-0 text-brass transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </summary>
          <p className="pb-7 pr-10 text-[1.02rem] leading-relaxed text-ink-2 max-w-[64ch]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
