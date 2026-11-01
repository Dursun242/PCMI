import type { Metadata } from "next";
import Link from "next/link";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import PlancheGratuite from "@/components/planche/PlancheGratuite";
import { CORRESPONDANCE_PIECES, HUB, PAGES_PLANCHES } from "@/config/planchesGratuites";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo(HUB.path, { title: HUB.metaTitre, description: HUB.description });

/**
 * Page d'accueil des plans gratuits : elle se classe sur les recherches
 * générales (« plans gratuits permis de construire ») et distribue vers les
 * trois pages dédiées, chacune visant sa propre recherche.
 */
export default function PlansGratuits() {
  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(HUB.path, HUB.h1, HUB.description, "DesignApplication"),
          faqPageSchema(HUB.faq),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: HUB.court, path: HUB.path },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h1 className="display mt-7 max-w-[18ch] text-5xl sm:text-6xl">{HUB.h1}</h1>
        <p className="lead mt-7 max-w-[62ch]">{HUB.chapo}</p>

        <ul className="mt-14 grid gap-px bg-stone-2 sm:grid-cols-3">
          {CORRESPONDANCE_PIECES.map((c) => {
            const page = PAGES_PLANCHES[c.planche];
            return (
              <li key={c.planche} className="flex flex-col bg-paper p-6 sm:p-8">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
                  {c.pcmi} · {c.pc} · {c.dp}
                </p>
                <h2 className="display mt-3 text-3xl">{page.court}</h2>
                <ul className="mt-5 mb-8 grid gap-2 text-[0.95rem] leading-snug text-ink-2">
                  {page.montre.slice(0, 3).map((m) => (
                    <li key={m} className="flex gap-3">
                      <span className="mt-2 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />
                      {m}
                    </li>
                  ))}
                </ul>
                <Link href={page.path} className="btn btn-line mt-auto !min-h-11 self-start">
                  Voir le {page.court.toLowerCase()}
                </Link>
              </li>
            );
          })}
        </ul>

        <section id="formulaire" className="mt-14 scroll-mt-24 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Demander un plan gratuit">
          <PlancheGratuite planchePage="masse" />
        </section>
      </div>

      <section className="border-y border-stone-2 bg-stone">
        <article className="prose-guide mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2>Les plans du terrain dans un permis ou une déclaration préalable</h2>
          <p>
            Les trois premières pièces d&apos;un dossier d&apos;urbanisme décrivent le terrain : où il se trouve, sa forme
            et son relief. Elles portent un numéro différent selon le dossier, mais leur rôle est le même.
          </p>
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Permis de maison</th>
                <th>Autre permis</th>
                <th>Déclaration préalable</th>
              </tr>
            </thead>
            <tbody>
              {CORRESPONDANCE_PIECES.map((c) => (
                <tr key={c.planche}>
                  <td>
                    <Link href={PAGES_PLANCHES[c.planche].path}>{c.nom}</Link>
                  </td>
                  <td>{c.pcmi}</td>
                  <td>{c.pc}</td>
                  <td>{c.dp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Notre planche gratuite montre l&apos;état existant, avec notre filigrane et la mention « document
            indicatif » : elle sert à préparer le projet, à vérifier la place disponible et à en parler avec la mairie ou
            un constructeur. Les pièces à déposer, avec la construction projetée, font partie de nos{" "}
            <Link href="/tarifs">formules de permis à prix fixe</Link>.
          </p>
          <h2>Questions fréquentes</h2>
          {HUB.faq.map((f) => (
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
