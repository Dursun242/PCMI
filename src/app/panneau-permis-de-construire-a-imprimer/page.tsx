import type { Metadata } from "next";
import Link from "next/link";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import GenerateurPanneau from "@/components/outils/GenerateurPanneau";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";

const PATH = "/panneau-permis-de-construire-a-imprimer";
const DESCRIPTION =
  "Créez gratuitement votre panneau de permis de construire ou de déclaration préalable : mentions obligatoires, format 120 × 80 cm prêt pour l'imprimeur, PDF ou SVG.";

export const metadata: Metadata = withSeo(PATH, {
  title: "Panneau permis de construire à imprimer : générateur gratuit",
  description: DESCRIPTION,
});

const ARTICLE = "/conseils/panneau-permis-de-construire-affichage-obligatoire";

const faq: { q: string; a: string }[] = [
  {
    q: "Quelle taille doit faire le panneau de permis de construire ?",
    a: "Le panneau doit être rectangulaire et mesurer plus de 80 cm dans ses deux dimensions. Le format courant est 120 × 80 cm, celui du fichier produit par ce générateur.",
  },
  {
    q: "Quelles mentions sont obligatoires sur le panneau ?",
    a: "Le nom du bénéficiaire, le numéro et la date de l'autorisation, la nature des travaux, la superficie du terrain, l'adresse de la mairie où consulter le dossier et, pour une construction, la surface de plancher autorisée et la hauteur par rapport au sol naturel. S'y ajoute la mention des droits de recours des tiers, que le générateur insère d'office.",
  },
  {
    q: "Le panneau est-il obligatoire pour une déclaration préalable ?",
    a: "Oui. Une déclaration préalable non contestée s'affiche sur le terrain comme un permis, avec les mêmes mentions : c'est cet affichage qui fait courir le délai de recours des tiers. Choisissez « Déclaration préalable » en haut du générateur.",
  },
  {
    q: "Combien de temps faut-il laisser le panneau ?",
    a: "Pendant toute la durée du chantier, et au moins deux mois sans interruption : le délai de recours des tiers court à partir du premier jour de cet affichage continu.",
  },
  {
    q: "Où faire imprimer le panneau ?",
    a: "Chez un imprimeur ou un service de reprographie, sur un support rigide qui tient dehors (PVC expansé, Akilux, Dibond). Envoyez-leur le fichier SVG au format réel 120 × 80 cm. Comptez quelques dizaines d'euros.",
  },
];

const lien = "text-ink underline decoration-brass underline-offset-4";

export default function PanneauPage() {
  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(PATH, "Générateur de panneau de permis de construire", DESCRIPTION, "UtilitiesApplication"),
          faqPageSchema(faq),
          breadcrumb([
            { name: "Accueil", path: "/" },
            { name: "Outils gratuits", path: "/outils" },
            { name: "Panneau de permis à imprimer", path: PATH },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h1 className="display mt-7 text-5xl sm:text-6xl">Panneau de permis de construire à imprimer</h1>
        <p className="lead mt-7 max-w-[62ch]">
          Saisissez les informations de votre arrêté : le générateur place toutes les mentions obligatoires, y compris celle
          des droits de recours, sur un panneau au format réel 120 × 80 cm. Vous le téléchargez gratuitement, prêt à
          confier à un imprimeur. Il vaut pour un permis de construire comme pour une déclaration préalable.
        </p>

        <section className="mt-14 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Générateur de panneau">
          <GenerateurPanneau />
        </section>
        <p className="mt-4 text-sm text-ink-2">
          Mentions fixées par les articles A. 424-15 à A. 424-19 du code de l&apos;urbanisme. Aucune donnée n&apos;est
          enregistrée : le panneau est dessiné dans votre navigateur.
        </p>
      </div>

      <section className="border-y border-stone-2 bg-stone">
        <article className="prose-guide mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2>Où trouver chaque mention sur votre arrêté</h2>
          <ul>
            <li>
              <strong>Numéro et date</strong> : en tête de l&apos;arrêté. Le numéro commence par PC (permis de construire)
              ou DP (déclaration préalable), suivi du code de la commune, de l&apos;année et d&apos;un numéro d&apos;ordre.
            </li>
            <li>
              <strong>Surface de plancher et hauteur</strong> : dans l&apos;arrêté ou, à défaut, dans le CERFA déposé.
              Reportez-les à l&apos;identique, sans les arrondir de mémoire.
            </li>
            <li>
              <strong>Superficie du terrain</strong> : celle déclarée dans le CERFA, issue du cadastre ou du plan de bornage.
            </li>
            <li>
              <strong>Mairie</strong> : l&apos;adresse du service où le dossier peut être consulté, en général la mairie de la
              commune du terrain.
            </li>
          </ul>

          <h2>Faire imprimer et poser le panneau</h2>
          <p>
            Envoyez le fichier téléchargé à un imprimeur : il est vectoriel, au format exact, et s&apos;imprime net quelle que
            soit la taille. Demandez un support rigide et résistant à la pluie. Posez le panneau en limite de la voie
            publique, tourné vers elle, lisible sans entrer sur le terrain, dès réception de l&apos;arrêté.
          </p>
          <p>
            Un panneau incomplet, illisible ou tombé ne fait pas courir le délai de recours des tiers. Les règles
            d&apos;affichage, la durée et la façon de prouver la pose sont détaillées dans notre article sur{" "}
            <Link href={ARTICLE}>le panneau de permis de construire et l&apos;affichage obligatoire</Link>.
          </p>

          <h2>Questions fréquentes</h2>
          {faq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Pas encore de permis ?</h2>
        <p className="mt-6 max-w-[62ch] leading-relaxed text-ink-2">
          Nous montons votre dossier de permis de construire, pièces PCMI 1 à 8, le déposons et le suivons jusqu&apos;à
          l&apos;arrêté. Prix fixe, annoncé avant de commencer. Les autres{" "}
          <Link href="/outils" className={lien}>outils gratuits</Link> vous aident à préparer votre projet.
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
