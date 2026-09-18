import type { Metadata } from "next";
import { site } from "@/config/site";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/confidentialite", {
  title: "Politique de confidentialité",
  description: "Comment Permis by ID Maîtrise collecte, utilise et conserve vos données personnelles, et comment exercer vos droits RGPD.",
  robots: { index: false, follow: true },
});

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 prose-guide">
      <h1 className="display text-5xl">Politique de confidentialité</h1>

      <h2>Responsable du traitement</h2>
      <p>
        {site.legal.company}, {site.address.street}, {site.address.zip} {site.address.city}.
      </p>

      <h2>Données collectées</h2>
      <p>
        Via le formulaire de devis : nom, e-mail, téléphone, commune du terrain, caractéristiques du projet et message libre. Ces données sont nécessaires pour établir votre devis (base légale : mesures précontractuelles à votre demande).
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <p>
        Vos données sont traitées par {site.legal.company} et transitent par notre prestataire d&apos;envoi d&apos;e-mails (Resend) et notre hébergeur (Vercel), qui stocke également les documents que vous joignez (plans, photos) le temps du traitement. Elles ne sont ni vendues ni cédées.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Trois ans après le dernier contact pour une demande sans suite ; la durée légale des documents contractuels et comptables pour une mission réalisée.
      </p>

      <h2>Cookies et mesure d&apos;audience</h2>
      <p>
        Ce site n&apos;utilise aucun cookie publicitaire. Si une mesure d&apos;audience est activée, elle est configurée sans identification individuelle.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et d&apos;opposition. Écrivez-nous via notre <a href="/contact">formulaire de contact</a>. Vous pouvez également saisir la CNIL.
      </p>
    </div>
  );
}
