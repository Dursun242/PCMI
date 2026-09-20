import type { Metadata } from "next";
import Link from "next/link";
import EtudeThermiqueForm from "@/components/EtudeThermiqueForm";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { breadcrumb, contactPageSchema, faqPageSchema, thermiqueServiceSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { site, thermique } from "@/config/site";
import { formatEuro } from "@/lib/format";

export const metadata: Metadata = withSeo("/etude-thermique-re2020", {
  title: "Étude thermique RE2020 : attestation, Bbio, ACV",
  description:
    "Attestation RE2020 au dépôt du permis et à l'achèvement, étude thermique complète (Bbio, Cep, DH), analyse de cycle de vie (Ic construction). Par le thermicien d'un bureau d'études qui dessine aussi votre maison, à prix fixe, partout en France.",
});

const indicateurs: [string, string][] = [
  ["Bbio", "Le besoin bioclimatique : ce que la maison demande en chauffage, refroidissement et éclairage avant tout équipement. Il dépend des orientations, des surfaces vitrées, de l'isolation et de la compacité. C'est lui que vérifie l'attestation au dépôt du permis."],
  ["Cep et Cep,nr", "Les consommations d'énergie primaire, totale et non renouvelable : chauffage, eau chaude, ventilation, éclairage, auxiliaires. C'est ici que le choix du chauffage pèse le plus."],
  ["DH", "Les degrés-heures d'inconfort : le nombre d'heures où la maison dépasse la température de confort en été. Protections solaires, inertie et ventilation nocturne font la différence."],
  ["Ic énergie", "L'impact carbone des consommations sur cinquante ans. Une pompe à chaleur ou un poêle à granulés le font chuter ; une chaudière gaz le rend difficile à tenir."],
  ["Ic construction", "L'analyse de cycle de vie (ACV) des matériaux : de la fabrication à la fin de vie. Béton, bois, isolants, menuiseries : chaque produit compte avec sa fiche FDES. Les seuils se durcissent en 2025, 2028 et 2031."],
];

const faqThermique = [
  {
    q: "L'attestation RE2020 est-elle obligatoire pour mon permis ?",
    a: "Oui, pour toute maison individuelle neuve dont le permis est déposé depuis le 1er janvier 2022. Une première attestation est jointe au dépôt du permis de construire ; une seconde, à la déclaration d'achèvement des travaux (DAACT). Sans la première, le dossier est incomplet et la mairie demande une pièce complémentaire.",
  },
  {
    q: "Quelle différence entre l'attestation et l'étude thermique complète ?",
    a: "L'attestation au dépôt ne vérifie que le Bbio et quelques exigences de moyens : elle suffit pour la mairie. L'étude complète calcule tous les indicateurs (Bbio, Cep, Cep,nr, DH, Ic énergie, Ic construction) et fixe les performances à exiger de vos artisans : épaisseurs d'isolant, menuiseries, chauffage, ventilation. C'est elle qui garantit que la maison passera l'attestation d'achèvement.",
  },
  {
    q: "Qu'est-ce que l'ACV et pourquoi en parle-t-on autant ?",
    a: "L'analyse de cycle de vie mesure l'impact carbone des matériaux de la maison, de leur fabrication à leur fin de vie, sur cinquante ans. C'est la nouveauté de la RE2020 par rapport à la RT2012, et ses seuils se durcissent par paliers en 2025, 2028 et 2031. Le mode constructif (parpaing, brique, ossature bois) et les isolants pèsent lourd dans le résultat.",
  },
  {
    q: "Pouvez-vous faire l'étude si mon permis a été fait ailleurs ?",
    a: "Oui. Nous travaillons à partir de n'importe quels plans, du constructeur, d'un dessinateur ou d'un architecte. Il nous faut les plans cotés, la localisation du terrain et le système de chauffage envisagé.",
  },
  {
    q: "Le test d'étanchéité à l'air est-il inclus ?",
    a: "Non : il est réalisé sur le chantier par un opérateur agréé, indépendant du bureau d'études. Nous vous indiquons la valeur à atteindre, nous intégrons le résultat dans l'attestation d'achèvement, et nous pouvons vous orienter vers un opérateur près de chez vous.",
  },
  {
    q: "Et si l'étude montre que la maison ne passe pas ?",
    a: "C'est précisément l'intérêt de la faire avant de consulter les artisans. Nous proposons des variantes chiffrées (isolant, menuiseries, chauffage, protections solaires) et retenons avec vous celle qui atteint les seuils au meilleur coût. Comme le même bureau d'études dessine la maison, la modification est reportée sur les plans sans aller-retour.",
  },
];

export default function EtudeThermiquePage() {
  return (
    <>
      <JsonLd
        data={[
          thermiqueServiceSchema(),
          faqPageSchema(faqThermique),
          contactPageSchema("/etude-thermique-re2020", "Chiffrer une étude thermique RE2020"),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Étude thermique RE2020", path: "/etude-thermique-re2020" },
          ]),
        ]}
      />

      <section className="bg-stone border-b border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl lg:text-7xl max-w-[16ch]">
            L&apos;étude thermique RE2020, par ceux qui dessinent la maison.
          </h1>
          <p className="lead mt-8 max-w-[54ch]">
            Attestation obligatoire au dépôt du permis, étude complète avec Bbio, Cep et confort d&apos;été, analyse de
            cycle de vie des matériaux, attestation d&apos;achèvement : chez {site.name}, le thermicien travaille dans
            le même bureau d&apos;études que le dessinateur et l&apos;ingénieur structure. Quand un indicateur ne passe
            pas, la maison est corrigée sur les plans, pas dans un rapport que personne ne lit.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#chiffrer" className="btn btn-ink">Chiffrer mon étude</a>
            <a href="#prestations" className="btn btn-line">Voir les prestations</a>
          </div>
        </div>
      </section>

      <section id="prestations" className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24 scroll-mt-24">
        <div className="max-w-[60ch]">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Du dépôt du permis à la fin des travaux</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Chaque prestation se commande seule ou dans le pack. Prix indiqués <strong className="text-ink">à partir de</strong>,
            TTC ; le devis exact dépend de la surface, du mode constructif et du système de chauffage.
          </p>
        </div>
        <dl className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {thermique.map((t) => (
            <div key={t.id} id={t.id} className={`border-t pt-5 scroll-mt-24 ${t.highlight ? "border-brass" : "border-ink"}`}>
              <dt className="flex items-baseline justify-between gap-4">
                <span className="display text-2xl leading-tight">{t.name}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-2">à partir de</span>
                  <span className="numeral text-2xl">{formatEuro(t.fromPriceTTC)}</span>
                </span>
              </dt>
              <dd className="mt-2">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brass">{t.when}</span>
                <p className="mt-2 leading-relaxed text-ink-2">{t.description}</p>
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {t.deliverables.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span className="mt-[0.7em] h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-ink-2">
          Prix TTC, TVA 20 % incluse. L&apos;attestation au dépôt est incluse dans les formules permis Complet et Premium
          (voir les <Link href="/tarifs" className="underline decoration-brass underline-offset-2">formules</Link>).
        </p>
      </section>

      <section className="bg-stone border-y border-stone-2">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24 grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Les cinq indicateurs de la RE2020</h2>
            <p className="mt-6 text-ink-2 leading-relaxed">
              La réglementation environnementale 2020 remplace la RT2012 depuis le 1er janvier 2022. Elle ne se
              contente plus de limiter la consommation : elle mesure aussi le confort d&apos;été et le carbone des
              matériaux. Voici ce que calcule l&apos;étude, en langage clair.
            </p>
          </div>
          <dl className="grid gap-5">
            {indicateurs.map(([t, d]) => (
              <div key={t} className="border-t border-stone-2 pt-4 grid gap-1 sm:grid-cols-[8rem_1fr]">
                <dt className="numeral text-2xl leading-tight">{t}</dt>
                <dd className="text-[0.95rem] leading-relaxed text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="chiffrer" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <span className="rule" aria-hidden="true" />
            <h2 className="h-section mt-6">Votre devis RE2020 sous 4 h ouvrées</h2>
            <p className="mt-6 text-ink-2 leading-relaxed">
              Cochez ce qu&apos;il vous faut, dites-nous où en est le projet et joignez vos plans si vous les avez.
              Notre thermicien vous répond avec un prix fixe par prestation.
            </p>
            <div className="mt-10 border-t border-stone-2 pt-6">
              <p className="display text-2xl">Vous cherchez aussi les plans pour construire ?</p>
              <p className="mt-1 text-sm text-ink-2">
                Fondations, béton armé, charpente, réseaux : les plans d&apos;exécution sont dessinés et calculés par le
                même bureau d&apos;études.
              </p>
              <Link href="/plans-execution" className="btn btn-line mt-4 !min-h-11">Voir les plans d&apos;exécution</Link>
            </div>
            <Garanties className="mt-12" />
          </div>
          <div className="bg-stone px-6 py-8 sm:px-10 sm:py-12">
            <EtudeThermiqueForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Questions fréquentes</h2>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Pour situer l&apos;attestation parmi les autres pièces du dossier, lisez le{" "}
            <Link href="/permis-de-construire-maison" className="text-ink underline decoration-brass underline-offset-4">
              guide du permis de construire de maison individuelle
            </Link>
            .
          </p>
        </div>
        <Faq items={faqThermique} />
      </section>
    </>
  );
}
