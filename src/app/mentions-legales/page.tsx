import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: true },
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsPage() {
  const l = site.legal;
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 prose-guide">
      <h1 className="display text-5xl">Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        {l.company}
        {l.siren && <>, SIREN {l.siren}, RCS {l.rcs}</>}
        {l.vat && <>, TVA intracommunautaire {l.vat}</>}
        <br />
        Siège : {site.address.street}, {site.address.zip} {site.address.city}
        <br />
        Directeur de la publication : {l.director}
        <br />
        Contact : <a href="/contact">formulaire de contact</a>
        {site.phone && <> — {site.phone}</>}
      </p>

      <h2>Activité</h2>
      <p>
        Maîtrise d&apos;œuvre en bâtiment : conception, dossiers d&apos;autorisation d&apos;urbanisme, direction et suivi de travaux.
        {l.insurer && <> Assurance responsabilité civile professionnelle : {l.insurer}.</>}
      </p>

      <h2>Hébergement</h2>
      <p>{l.host}</p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus de ce site (textes, dessins, illustrations, code) est la propriété de {l.company} et ne peut être reproduit sans autorisation écrite. Les plans et documents produits pour un client lui sont cédés pour l&apos;usage prévu au devis.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Les informations transmises via le formulaire de devis sont utilisées uniquement pour répondre à votre demande. Voir la <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </div>
  );
}
