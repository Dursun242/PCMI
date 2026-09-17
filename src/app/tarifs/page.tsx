import type { Metadata } from "next";
import Link from "next/link";
import { plans, options, site } from "@/config/site";
import PlanCard, { formatEuro } from "@/components/PlanCard";
import JsonLd from "@/components/JsonLd";
import { breadcrumb, organizationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/tarifs", {
  title: "Tarifs permis de construire maison : trois formules à prix fixe",
  description:
    "Prix d'un permis de construire de maison individuelle jusqu'à 149 m² de surface de plancher, réalisé par un maître d'œuvre : Essentiel, Complet ou Premium, à prix fixe, partout en France. Au-delà, sur devis.",
  alternates: { canonical: "/tarifs" },
});

const rows: { label: string; values: (boolean | string)[] }[] = [
  { label: "Pièces PCMI 1 à 8 à l'échelle", values: [true, true, true] },
  { label: "Notice descriptive et CERFA", values: [true, true, true] },
  { label: "Contrôle du PLU / PLUi", values: [true, true, true] },
  { label: "Modifications avant dépôt", values: ["1 série", "Illimitées", "Illimitées"] },
  { label: "Dépôt en mairie (dématérialisé ou papier)", values: [false, true, true] },
  { label: "Réponses aux demandes de pièces", values: [false, true, true] },
  { label: "Suivi jusqu'à l'accord", values: [false, true, true] },
  { label: "Insertion 3D réaliste (PCMI 6)", values: ["2D", "1 vue", "3 vues"] },
  { label: "Attestation RE2020", values: ["Option", true, true] },
  { label: "Étude eaux pluviales", values: ["Option", "Option", true] },
  { label: "Conception des plans à partir de vos besoins", values: [false, false, true] },
  { label: "Relecture du CCMI / devis constructeur", values: [false, false, true] },
  { label: "Rendez-vous visio", values: ["1", "2", "À chaque étape"] },
  { label: "Délai de livraison", values: plans.map((p) => p.delayWorkingDays) },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="inline-block h-px w-4 bg-brass align-middle" aria-label="Inclus" />;
  if (v === false) return <span className="text-ink-3" aria-label="Non inclus">·</span>;
  return <span>{v}</span>;
}

export default function TarifsPage() {
  return (
    <>
      <JsonLd data={[organizationSchema, breadcrumb([{ name: "Accueil", path: "/" }, { name: "Tarifs", path: "/tarifs" }])]} />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[14ch]">
            Trois formules, un prix fixe annoncé <em>avant</em> de commencer.
          </h1>
          <p className="lead mt-8 max-w-[52ch]">
            Le prix ne dépend ni de la surface de votre maison ni de son coût de construction. Il dépend uniquement de ce que nous faisons pour vous. Ces formules s&apos;appliquent aux maisons jusqu&apos;à <strong className="text-ink">149 m² de surface de plancher</strong>, sans architecte. Au-delà, le permis est établi sur devis. Prix toutes taxes comprises, TVA 20 % incluse.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 sm:pt-20">
        <div className="grid gap-8 lg:gap-0 lg:grid-cols-3 lg:items-stretch">
          {plans.map((p) => (
            <div key={p.id} id={p.id} className="scroll-mt-24 flex">
              <PlanCard plan={p} />
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-ink pt-6 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-[60ch]">
            <p className="display text-2xl">Maison de 150 m² et plus : sur devis.</p>
            <p className="mt-1 text-ink-2">
              Le recours à un architecte devient obligatoire. Nous montons le dossier avec notre architecte partenaire et vous adressons un devis personnalisé sous 48 h.
            </p>
          </div>
          <Link href="/devis" className="btn btn-line">Demander un devis sur mesure</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Le détail, ligne par ligne</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[0.95rem]">
            <thead>
              <tr>
                <th className="py-4 pr-4 text-left text-[0.7rem] uppercase tracking-[0.18em] text-ink-2 border-b border-ink w-[44%]">Prestation</th>
                {plans.map((p) => (
                  <th key={p.id} className={`py-4 px-3 text-center border-b border-ink ${p.highlight ? "bg-stone" : ""}`}>
                    <div className="display text-2xl">{p.name}</div>
                    <div className="text-xs text-ink-2">{formatEuro(p.priceTTC)} TTC</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-3.5 pr-4 border-b border-stone-2">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`py-3.5 px-3 text-center border-b border-stone-2 ${plans[i].highlight ? "bg-stone" : ""}`}>
                      <Cell v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-stone">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid gap-16 lg:grid-cols-2">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Options</h2>
            <ul className="mt-8 divide-y divide-stone-2 border-y border-ink">
              {options.map((o) => (
                <li key={o.name} className="flex items-start justify-between gap-6 py-5">
                  <div>
                    <div className="font-bold">{o.name}</div>
                    <div className="text-sm text-ink-2">{o.note}</div>
                  </div>
                  <div className="shrink-0 numeral text-2xl">{formatEuro(o.priceTTC)} <span className="font-sans text-xs text-ink-2">TTC</span></div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Paiement et garanties</h2>
            <dl className="mt-8 grid gap-6">
              <div>
                <dt className="font-bold">Acompte de 40 %, solde à la livraison</dt>
                <dd className="text-ink-2 leading-relaxed">Par virement ou carte bancaire. Facture émise par {site.legal.company}, maître d&apos;œuvre assuré en responsabilité civile professionnelle.</dd>
              </div>
              <div>
                <dt className="font-bold">Prix fixe</dt>
                <dd className="text-ink-2 leading-relaxed">Le montant du devis est celui de la facture. Les seules variations possibles sont les options que vous ajoutez vous-même.</dd>
              </div>
              <div>
                <dt className="font-bold">Refus de permis</dt>
                <dd className="text-ink-2 leading-relaxed">Avec Complet et Premium, nous reprenons le dossier et le redéposons sans supplément tant que le refus porte sur un point que nous maîtrisons (conformité au PLU, pièces, cotes). Un refus lié à un changement de règle ou à un avis extérieur fait l&apos;objet d&apos;une analyse offerte.</dd>
              </div>
              <div>
                <dt className="font-bold">À partir de 150 m² de surface de plancher</dt>
                <dd className="text-ink-2 leading-relaxed">Les trois formules ne s&apos;appliquent plus : le recours à un architecte est obligatoire et le permis est établi sur devis uniquement, avec notre architecte partenaire.</dd>
              </div>
            </dl>
            <Link href="/devis" className="btn btn-ink mt-10">Demander un devis</Link>
          </div>
        </div>
      </section>
    </>
  );
}
