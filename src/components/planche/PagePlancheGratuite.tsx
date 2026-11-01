import Link from "next/link";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import PlancheGratuite from "@/components/planche/PlancheGratuite";
import { HUB, type PagePlanche } from "@/config/planchesGratuites";
import { ORDRE_PLANCHES, PLANCHES } from "@/lib/planche";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";

const lien = "text-ink underline decoration-brass underline-offset-4";

/** Page d'une planche gratuite : réponse, formulaire, puis guide et questions fréquentes. */
export default function PagePlancheGratuite({ page }: { page: PagePlanche }) {
  const autres = ORDRE_PLANCHES.filter((p) => p !== page.planche);
  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(page.path, page.h1, page.description, "DesignApplication"),
          faqPageSchema(page.faq),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: HUB.court, path: HUB.path },
            { name: page.court, path: page.path },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
          <div>
            <span className="rule" aria-hidden="true" />
            <h1 className="display mt-7 text-5xl sm:text-6xl">{page.h1}</h1>
            <p className="lead mt-7 max-w-[60ch]">{page.chapo}</p>
          </div>
          <aside className="self-end border-t border-ink pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Sur la planche</p>
            <ul className="mt-4 grid gap-2.5 text-[0.95rem] leading-snug">
              {page.montre.map((m) => (
                <li key={m} className="flex gap-3">
                  <span className="mt-2 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section id="formulaire" className="mt-14 scroll-mt-24 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Demander la planche gratuite">
          <PlancheGratuite planchePage={page.planche} />
        </section>
        <p className="mt-4 max-w-[80ch] text-sm text-ink-2">
          Planche dessinée par notre bureau d&apos;études à partir du cadastre et des données de l&apos;IGN, avec notre
          filigrane et la mention « document indicatif ». Une planche gratuite par parcelle. Aussi disponibles :{" "}
          {autres.map((p, i) => (
            <span key={p}>
              <Link href={PLANCHES[p].path} className={lien}>{PLANCHES[p].titre.toLowerCase()}</Link>
              {i < autres.length - 1 ? " ou " : "."}
            </span>
          ))}{" "}
          <Link href={HUB.path} className={lien}>Tous nos plans gratuits</Link>.
        </p>
      </div>

      <section className="border-y border-stone-2 bg-stone">
        <article className="prose-guide mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          {page.sections.map((s) => (
            <div key={s.titre}>
              <h2>{s.titre}</h2>
              {s.paragraphes.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          ))}
          <h2>Questions fréquentes</h2>
          {page.faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Et pour le permis complet ?</h2>
        <p className="mt-6 max-w-[62ch] leading-relaxed text-ink-2">
          Nous montons votre dossier de permis de construire, pièces PCMI 1 à 8, le déposons en mairie et le suivons
          jusqu&apos;à l&apos;arrêté. Prix fixe annoncé avant de commencer, payable en 1, 4 ou 10 fois.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/commander" className="btn btn-ink">Commander mon permis</Link>
          <Link href="/tarifs" className="btn btn-line">Voir les tarifs</Link>
        </div>
        <Garanties className="mt-16" />
      </section>
    </>
  );
}
