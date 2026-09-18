import type { Metadata } from "next";
import { legal, isTodo } from "@/lib/legal";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/mentions-legales", {
  title: "Mentions légales",
  description: "Éditeur, hébergeur, propriété intellectuelle et coordonnées légales du site Permis by ID Maîtrise.",
  robots: { index: false, follow: true },
});

export default function MentionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 prose-guide">
      <h1 className="display text-5xl">Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        {legal.raisonSociale} ({legal.forme})
        {!isTodo(legal.capital) && <> au capital de {legal.capital}</>}
        {!isTodo(legal.siren) && <>, SIREN {legal.siren}</>}
        {!isTodo(legal.siret) && <>, SIRET {legal.siret}</>}
        , RCS {legal.rcs}
        {!isTodo(legal.tva) && <>, TVA intracommunautaire {legal.tva}</>}
        <br />
        Siège : {legal.adresse.street}, {legal.adresse.zip} {legal.adresse.city}
        <br />
        Directeur de la publication : {legal.directeurPublication}
        <br />
        Contact : <a href="/contact">formulaire de contact</a> — {legal.telephone}
      </p>

      <h2>Activité</h2>
      <p>
        Maîtrise d&apos;œuvre en bâtiment : conception, dossiers d&apos;autorisation d&apos;urbanisme, direction et suivi de travaux.
        {!isTodo(legal.assurance.assureur) && (
          <>
            {" "}Assurance responsabilité civile professionnelle : {legal.assurance.assureur}
            {!isTodo(legal.assurance.policeNumero) && <>, police n° {legal.assurance.policeNumero}</>}.
          </>
        )}
      </p>

      <h2>Hébergement</h2>
      <p>{legal.hebergeur}</p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus de ce site (textes, dessins, illustrations, code) est la propriété de {legal.raisonSociale} et ne peut être reproduit sans autorisation écrite. Les plans et documents produits pour un client lui sont cédés pour l&apos;usage prévu au devis.
      </p>

      {!isTodo(legal.mediateur.nom) && (
        <>
          <h2>Médiation de la consommation</h2>
          <p>
            Conformément aux articles L. 616-1 et R. 616-1 du Code de la consommation, en cas de litige non résolu directement avec nous, vous pouvez recourir gratuitement au médiateur de la consommation : {legal.mediateur.nom}, {legal.mediateur.adresse} — {legal.mediateur.site}.
          </p>
        </>
      )}

      <h2>Données personnelles</h2>
      <p>
        Les informations transmises via les formulaires du site sont utilisées uniquement pour répondre à votre demande. Voir la <a href="/confidentialite">politique de confidentialité</a>. Voir aussi les <a href="/cgv">conditions générales de vente</a>.
      </p>
    </div>
  );
}
