import type { Metadata } from "next";
import Link from "next/link";
import CalculateurTaxe from "@/components/CalculateurTaxe";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import { formatEuro } from "@/lib/format";
import { calculerTaxe, TA_2026 } from "@/lib/taxeAmenagement";

const PATH = "/calcul-taxe-amenagement";
const DESCRIPTION =
  "Calculez la taxe d'aménagement de votre maison en 2026 : 892 €/m², abattement de 50 % sur 100 m², taux de votre commune et dates de paiement.";

export const metadata: Metadata = withSeo(PATH, {
  title: `Calcul taxe d'aménagement ${TA_2026.annee} : simulateur gratuit`,
  description: DESCRIPTION,
});

const SOURCE = "https://www.service-public.gouv.fr/particuliers/vosdroits/F23263";
const lien = "text-ink underline decoration-brass underline-offset-4";
const pct = (n: number) => `${n.toLocaleString("fr-FR")} %`;

/** Exemple chiffré du texte, calculé par la même fonction que le simulateur : il ne peut pas le contredire. */
const EXEMPLE = { surface: 120, communal: 5, departemental: 2.5 };
const exemple = calculerTaxe({
  surfaceTaxable: EXEMPLE.surface,
  residencePrincipale: true,
  ileDeFrance: false,
  tauxCommunal: EXEMPLE.communal,
  tauxDepartemental: EXEMPLE.departemental,
  tauxRegional: 0,
  piscineM2: 0,
  placesStationnement: 0,
  archeologie: true,
})!;

const V = TA_2026.valeurM2.horsIdf;
const faq: { q: string; a: string }[] = [
  {
    q: `Combien coûte la taxe d'aménagement pour une maison de ${EXEMPLE.surface} m² ?`,
    a: `Pour une résidence principale de ${EXEMPLE.surface} m² hors Île-de-France, avec un taux communal de ${pct(EXEMPLE.communal)} et un taux départemental de ${pct(EXEMPLE.departemental)}, la taxe d'aménagement est d'environ ${formatEuro(exemple.taxeAmenagement)}, et ${formatEuro(exemple.total)} avec la taxe d'archéologie préventive. Le montant dépend surtout du taux voté par votre commune.`,
  },
  {
    q: `Quelle est la valeur forfaitaire de la taxe d'aménagement en ${TA_2026.annee} ?`,
    a: `${formatEuro(V)} par m² de surface taxable hors Île-de-France et ${formatEuro(TA_2026.valeurM2.idf)} en Île-de-France. Les 100 premiers m² d'une résidence principale sont comptés à moitié prix, soit ${formatEuro(V / 2)} par m² hors Île-de-France.`,
  },
  {
    q: "Quand faut-il payer la taxe d'aménagement ?",
    a: `Après l'achèvement des travaux. Vous déclarez les surfaces dans les 90 jours qui suivent, depuis « Gérer mes biens immobiliers » sur impots.gouv.fr. Jusqu'à ${formatEuro(TA_2026.seuilPaiementUnique)}, la taxe est demandée en une fois ; au-delà, en deux moitiés, la seconde 6 mois après la première.`,
  },
  {
    q: "Comment connaître le taux de taxe d'aménagement de ma commune ?",
    a: "Demandez-le au service urbanisme de la mairie : le taux est voté chaque année par le conseil municipal ou intercommunal, et il peut varier d'un secteur à l'autre de la commune. Il figure aussi sur le certificat d'urbanisme d'information du terrain.",
  },
  {
    q: "Le garage et la terrasse sont-ils taxés ?",
    a: "Un garage clos et couvert entre dans la surface taxable, comme un cellier ou une véranda. Une terrasse non couverte, un balcon ou un auvent ouvert ne sont pas taxés. Les combles de moins de 1,80 m sous plafond ne comptent pas non plus.",
  },
];

export default function CalculTaxeAmenagementPage() {
  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(PATH, "Calculateur de taxe d'aménagement", DESCRIPTION),
          faqPageSchema(faq),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Calcul de la taxe d'aménagement", path: PATH },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h1 className="display mt-7 text-5xl sm:text-6xl">Calcul de la taxe d&apos;aménagement {TA_2026.annee}</h1>
        {/* Réponse d'abord : ce paragraphe répond à la question de la page. */}
        <p className="lead mt-7 max-w-[62ch]">
          La taxe d&apos;aménagement se calcule ainsi : surface taxable × {formatEuro(V)} par m² (valeur {TA_2026.annee}{" "}
          hors Île-de-France) × le taux de votre commune et de votre département. Pour une résidence principale, les 100
          premiers m² comptent à moitié. Une maison de {EXEMPLE.surface} m² paie ainsi environ{" "}
          <strong>{formatEuro(exemple.total)}</strong>, à régler après l&apos;achèvement des travaux.
        </p>

        <section className="mt-14 bg-stone px-6 py-8 sm:px-10 sm:py-12" aria-label="Calculateur">
          <CalculateurTaxe />
        </section>
        <p className="mt-4 text-sm text-ink-2">
          Valeurs {TA_2026.annee} de la{" "}
          <a href={SOURCE} target="_blank" rel="noopener noreferrer" className={lien}>
            fiche officielle de service-public.gouv.fr
          </a>
          . Aucune donnée n&apos;est enregistrée : le calcul se fait dans votre navigateur.
        </p>
      </div>

      <section className="bg-stone border-y border-stone-2">
        <article className="prose-guide mx-auto max-w-3xl px-5 sm:px-8 py-20 sm:py-24">
          <h2>Comment la taxe est calculée</h2>
          <p>
            La valeur taxable est la surface taxable multipliée par une valeur forfaitaire fixée chaque année par
            l&apos;État. Chaque collectivité y applique ensuite son taux, et les parts s&apos;additionnent.
          </p>
          <table>
            <thead>
              <tr><th>Élément</th><th>Valeur {TA_2026.annee}</th></tr>
            </thead>
            <tbody>
              <tr><td>Surface taxable, hors Île-de-France</td><td>{formatEuro(V)} / m²</td></tr>
              <tr><td>Surface taxable, Île-de-France</td><td>{formatEuro(TA_2026.valeurM2.idf)} / m²</td></tr>
              <tr><td>Piscine</td><td>{formatEuro(TA_2026.piscineM2)} / m² de bassin</td></tr>
              <tr><td>Place de stationnement extérieure</td><td>{formatEuro(TA_2026.stationnementPlace)} à {formatEuro(TA_2026.stationnementPlaceMax)} selon la commune</td></tr>
              <tr><td>Taux communal ou intercommunal</td><td>1 à 5 %, jusqu&apos;à 20 % dans certains secteurs</td></tr>
              <tr><td>Taux départemental</td><td>2,5 % au maximum</td></tr>
              <tr><td>Taux régional (Île-de-France)</td><td>1 % au maximum</td></tr>
              <tr><td>Taxe d&apos;archéologie préventive</td><td>0,40 % de la même valeur</td></tr>
            </tbody>
          </table>

          <h3>Exemple : maison de {EXEMPLE.surface} m² en résidence principale</h3>
          <ul>
            <li>100 premiers m² à moitié prix : 100 × {formatEuro(V / 2)} = {formatEuro(100 * (V / 2))}</li>
            <li>{EXEMPLE.surface - 100} m² suivants à plein tarif : {EXEMPLE.surface - 100} × {formatEuro(V)} = {formatEuro((EXEMPLE.surface - 100) * V)}</li>
            <li>Valeur taxable : {formatEuro(exemple.base)}</li>
            <li>Part communale ({pct(EXEMPLE.communal)}) : {formatEuro(exemple.partCommunale)} ; part départementale ({pct(EXEMPLE.departemental)}) : {formatEuro(exemple.partDepartementale)}</li>
            <li>Taxe d&apos;aménagement : <strong>{formatEuro(exemple.taxeAmenagement)}</strong>, plus {formatEuro(exemple.archeologie)} d&apos;archéologie préventive</li>
          </ul>

          <h2>Ce qui compte dans la surface taxable</h2>
          <p>
            Toutes les surfaces closes et couvertes de plus de 1,80 m sous plafond, mesurées à l&apos;intérieur des murs :
            la maison, mais aussi le garage, le cellier ou la véranda. C&apos;est pourquoi elle dépasse souvent la surface de
            plancher indiquée sur le permis. Les terrasses non couvertes, les balcons et les combles bas ne comptent pas.
            Le détail est dans notre article sur{" "}
            <Link href="/conseils/surface-de-plancher-emprise-au-sol-surface-taxable">
              la surface de plancher, l&apos;emprise au sol et la surface taxable
            </Link>
            .
          </p>

          <h2>Trouver le taux de votre commune</h2>
          <p>
            Le simulateur part de {pct(5)} pour la commune et {pct(2.5)} pour le département, les taux les plus courants
            en haut de fourchette : l&apos;estimation par défaut est donc prudente. Pour le montant réel, demandez le taux
            au service urbanisme de la mairie. Il peut changer d&apos;un secteur à l&apos;autre de la commune et
            s&apos;apprécie à la date de délivrance du permis. Le certificat d&apos;urbanisme d&apos;information du terrain
            l&apos;indique aussi.
          </p>

          <h2>Quand et comment payer</h2>
          <p>
            Rien n&apos;est à payer au dépôt du permis. Dans les 90 jours qui suivent l&apos;achèvement des travaux, vous
            déclarez les surfaces depuis « Gérer mes biens immobiliers » sur impots.gouv.fr. Jusqu&apos;à{" "}
            {formatEuro(TA_2026.seuilPaiementUnique)}, la taxe est demandée en une fois, à partir de 90 jours après
            l&apos;achèvement ; au-delà, elle est divisée en deux moitiés, la seconde demandée 6 mois après la première.
            Notre{" "}
            <Link href="/permis-de-construire-maison#taxe-amenagement">guide du permis de construire</Link> détaille la
            déclaration.
          </p>

          <h2>Exonérations et réductions</h2>
          <ul>
            <li>Une construction de 5 m² ou moins est exonérée d&apos;office.</li>
            <li>La reconstruction à l&apos;identique d&apos;un bâtiment démoli depuis moins de 10 ans est exonérée.</li>
            <li>
              La commune et le département peuvent exonérer en tout ou partie certains projets, par exemple les abris de
              jardin ou les surfaces au-delà de 100 m² financées par un prêt à taux zéro : renseignez-vous en mairie.
            </li>
          </ul>

          <h2>Questions fréquentes</h2>
          {faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Votre permis, à prix fixe</h2>
        <p className="mt-6 max-w-[62ch] text-ink-2 leading-relaxed">
          Nous montons votre dossier de permis de construire, pièces PCMI 1 à 8, avec la surface taxable calculée au m²
          près et déclarée sur le CERFA. Vous connaissez le prix avant de commencer.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/devis" className="btn btn-ink">Demander un devis</Link>
          <Link href="/tarifs" className="btn btn-line">Voir les tarifs</Link>
        </div>
        <Garanties className="mt-16" />
      </section>
    </>
  );
}
