import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import WhatsAppLink from "@/components/WhatsAppLink";
import { site } from "@/config/site";
import { withSeo } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { breadcrumb, contactPageSchema } from "@/lib/schema";

export const metadata: Metadata = withSeo("/contact", {
  title: "Contact — une question, un plan à faire relire, un permis refusé",
  description: "Écrivez-nous avec vos plans, croquis ou photos en pièce jointe. Réponse d'un maître d'œuvre sous 4 h ouvrées, partout en France.",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          contactPageSchema("/contact", "Contacter Permis by ID Maîtrise"),
          breadcrumb([{ name: "Accueil", path: "/" }, { name: "Contact", path: "/contact" }]),
        ]}
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24 grid gap-16 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl">Une question ? Un plan à relire ?</h1>
          <p className="lead mt-7 max-w-[42ch]">
            Joignez vos plans, votre croquis, les photos du terrain ou l&apos;arrêté de refus. Un maître d&apos;œuvre vous répond sous 4 h ouvrées.
          </p>
          <div className="mt-12 border-t border-ink pt-8 grid gap-6">
            <div>
              <p className="display text-2xl">Vous avez déjà tous les éléments ?</p>
              <p className="mt-1 text-ink-2 text-[0.95rem]">La fiche projet complète reprend les rubriques du CERFA 13406 : nous chiffrons votre permis sans échange préalable.</p>
              <Link href="/dossier" className="btn btn-line mt-4">Remplir la fiche projet</Link>
            </div>
            <div>
              <p className="display text-2xl">Vous préférez discuter en direct ?</p>
              <p className="mt-1 text-ink-2 text-[0.95rem]">
                Par message ou par appel WhatsApp, sur le portable du maître d&apos;œuvre. Vous pouvez y envoyer une
                photo de plan ou une question rapide.
              </p>
              <WhatsAppLink source="contact" className="btn btn-line mt-4 !min-h-11">
                Ouvrir WhatsApp
              </WhatsAppLink>
            </div>
            <div>
              <p className="display text-2xl">Vous préférez le téléphone ?</p>
              {site.phone && (
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-1 inline-block text-ink underline decoration-brass underline-offset-4">
                  {site.phone}
                </a>
              )}
              <p className="mt-1 text-sm text-ink-2">Laissez-nous un message, on vous rappelle.</p>
              <p className="mt-4 text-sm text-ink-2">{site.legal.company}, {site.address.street}, {site.address.zip} {site.address.city}</p>
            </div>
          </div>
        </div>
        <div className="bg-stone px-6 py-8 sm:px-10 sm:py-12">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
