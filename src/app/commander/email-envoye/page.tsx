import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappUrl } from "@/config/site";
import { SIGNATURE } from "@/lib/commande";

/**
 * Page de retour après la saisie de l'IBAN chez Qonto : la commande n'est pas
 * encore signée. Elle dit exactement quel e-mail attendre, quoi faire s'il
 * n'arrive pas, et ce qui se passe une fois la commande signée.
 */
export const metadata: Metadata = {
  title: "Dernière étape : signez votre commande",
  description: "Votre IBAN est enregistré. Signez votre commande depuis le lien reçu par e-mail.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/commander/email-envoye" },
};

const ensuite: [string, string][] = [
  ["Vous signez votre commande", "Depuis le lien de l'e-mail : devis, conditions générales de vente et échéancier, en un clic."],
  ["Nous vérifions votre terrain", "Nous lisons le règlement d'urbanisme de votre commune pour confirmer que le permis peut être déposé."],
  ["Nous lançons votre dossier", "Nous vous confirmons le démarrage par e-mail. Si le permis n'est pas possible, nous annulons tout : rien n'est prélevé."],
  ["Premier prélèvement", "Il n'intervient qu'après notre validation et la fin de votre délai de rétractation de 14 jours."],
];

export default function EmailEnvoyePage() {
  const whatsapp = whatsappUrl("Bonjour, je n'ai pas reçu l'e-mail pour signer ma commande de permis.");
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <p className="text-sm text-ink-2">
        <span className="numeral text-bronze">✓</span> Panier · <span className="numeral text-bronze">✓</span> Coordonnées ·{" "}
        <span className="numeral text-bronze">✓</span> Règlement · <span className="numeral text-bronze">✓</span> IBAN ·{" "}
        <strong className="text-ink">05 Signature</strong>
      </p>
      <h1 className="display mt-7 text-5xl sm:text-6xl">Dernière étape : signez votre commande.</h1>
      <p className="lead mt-6">
        Votre IBAN est bien enregistré. Nous venons de vous envoyer un e-mail : cliquez sur le bouton qu&apos;il contient pour
        relire et signer votre commande.
      </p>

      <dl className="mt-10 grid gap-3 border border-ink bg-paper p-6 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="font-bold">Expéditeur</dt>
        <dd>{site.name} &lt;{site.email}&gt;</dd>
        <dt className="font-bold">Objet</dt>
        <dd>{SIGNATURE.objetEmail}</dd>
        <dt className="font-bold">Lien valable</dt>
        <dd>{SIGNATURE.validiteJours} jours</dd>
      </dl>

      <div className="mt-10 border-l-2 border-brass pl-5 text-ink-2">
        <p className="font-bold text-ink">Vous ne le voyez pas ?</p>
        <ul className="mt-2 grid gap-1 text-sm">
          <li>Patientez une à deux minutes, puis actualisez votre boîte de réception.</li>
          <li>Regardez dans les dossiers « Spam », « Indésirables » ou « Promotions ».</li>
          <li>
            Toujours rien ? Appelez le{" "}
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-bold text-ink underline decoration-brass underline-offset-2">
              {site.phone}
            </a>
            {whatsapp && (
              <>
                {" "}ou{" "}
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline decoration-brass underline-offset-2">
                  écrivez-nous sur WhatsApp
                </a>
              </>
            )}
            .
          </li>
        </ul>
      </div>

      <h2 className="display mt-14 text-3xl">Et ensuite ?</h2>
      <ol className="mt-6 grid gap-6">
        {ensuite.map(([titre, detail], i) => (
          <li key={titre} className="flex gap-5">
            <span className="numeral text-3xl text-bronze w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="display text-2xl leading-tight">{titre}</div>
              <div className="mt-1 text-ink-2 text-[0.95rem]">{detail}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-sm text-ink-2">
        Vous pourrez vous rétracter pendant 14 jours après la signature, sans frais ni justification (
        <Link href="/cgv" className="underline decoration-brass underline-offset-2">conditions générales de vente</Link>).
      </p>
    </div>
  );
}
