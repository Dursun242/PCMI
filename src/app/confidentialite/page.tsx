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
        Ce site ne dépose aucun cookie publicitaire et ne pratique aucun suivi entre sites. La fréquentation est mesurée
        avec Vercel Web Analytics, un outil sans cookie : il n&apos;enregistre aucun identifiant permettant de vous
        reconnaître d&apos;une visite à l&apos;autre. Seuls sont comptés des
        événements anonymes de parcours (page consultée, clic sur un bouton de devis, formule retenue, tranche de
        surface). Aucune donnée que vous saisissez dans un formulaire — nom, e-mail, téléphone, commune — n&apos;est
        transmise à cet outil, qui ne conserve pas votre adresse IP. Cette mesure ne reposant sur aucune lecture ni
        écriture d&apos;information sur votre appareil, elle ne donne pas lieu à une demande de consentement.
      </p>
      <p>
        Le formulaire de fiche projet enregistre en revanche votre brouillon dans le stockage local de votre navigateur,
        pour que vous puissiez le reprendre plus tard. Cette donnée ne quitte pas votre appareil tant que vous
        n&apos;envoyez pas le formulaire, et vider les données de navigation la supprime.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et d&apos;opposition. Écrivez-nous via notre <a href="/contact">formulaire de contact</a>. Vous pouvez également saisir la CNIL.
      </p>
    </div>
  );
}
