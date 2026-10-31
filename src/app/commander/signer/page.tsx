import type { Metadata } from "next";
import Link from "next/link";
import { DevisVisuel, EcheancierTable } from "@/components/commande/DevisVisuel";
import SignatureCommande from "@/components/commande/SignatureCommande";
import { echeancierPrevisionnel } from "@/lib/commande";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { lireDevis, lireMandat } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";
import { jourParis } from "@/lib/suivi";

/**
 * Page ouverte depuis l'e-mail « Confirmez votre commande » : le client relit
 * son devis, l'échéancier, le mandat et les CGV, puis signe. Tout est relu à
 * la source (jeton signé, devis et mandat chez Qonto) à chaque affichage.
 */
export const metadata: Metadata = {
  title: "Signer votre commande",
  description: "Relisez votre devis, votre échéancier et les conditions générales de vente, puis signez votre commande.",
  robots: { index: false, follow: false },
  // Le jeton de l'adresse porte les coordonnées du client : il ne doit jamais partir vers un autre site.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const ETAPES_FAITES = ["Panier", "Coordonnées", "Règlement", "IBAN"];

function Message({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <h1 className="display text-5xl">{titre}</h1>
      <div className="lead mt-6 grid gap-4">{children}</div>
    </div>
  );
}

export default async function SignerPage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;
  const signable = commandeDuJeton(jeton);
  if (!signable || !jeton) {
    return (
      <Message titre="Ce lien n'est plus valable.">
        <p>Il a expiré ou il est incomplet. Recommencez votre commande : cela ne prend que quelques minutes.</p>
        <p><Link href="/commander" className="btn btn-ink">Recommencer ma commande</Link></p>
      </Message>
    );
  }

  let devis, mandat;
  try {
    const cfg = await ouvrirQonto();
    [devis, mandat] = await Promise.all([lireDevis(cfg, signable.donnees.devisId), lireMandat(cfg, signable.donnees.mandatId)]);
  } catch (err) {
    console.error("[commande/signer] lecture Qonto échouée", err);
    return (
      <Message titre="Votre commande est momentanément indisponible.">
        <p>Réessayez dans quelques minutes depuis le lien de votre e-mail.</p>
      </Message>
    );
  }

  if (!mandat.signe) {
    return (
      <Message titre="Votre mandat n'est pas encore validé.">
        <p>Saisissez votre IBAN et validez le mandat de prélèvement sur la page sécurisée Qonto, puis revenez sur ce lien.</p>
        {mandat.urlSignature && (
          <p><a href={mandat.urlSignature} className="btn btn-ink">Saisir mon IBAN</a></p>
        )}
      </Message>
    );
  }

  const { commande } = signable;
  const { coordonnees: c, echeancier } = commande;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <p className="text-sm text-ink-2">
        {ETAPES_FAITES.map((e) => (
          <span key={e}>
            <span className="numeral text-bronze">✓</span> {e} ·{" "}
          </span>
        ))}
        <strong className="text-ink">05 Signature</strong>
      </p>
      <h1 className="display mt-7 text-5xl sm:text-6xl">Signez votre commande.</h1>
      <p className="lead mt-6">
        Relisez votre commande, {c.prenom}. Rien n&apos;est prélevé à la signature : nous vérifions d&apos;abord que votre
        terrain permet le dépôt du permis.
      </p>

      <section className="mt-10" aria-label="Votre devis">
        <DevisVisuel devis={devis} />
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={devis.url} target="_blank" rel="noopener noreferrer" className="underline decoration-brass underline-offset-2">Ouvrir le devis officiel (PDF)</a>
          <Link href="/cgv" target="_blank" className="underline decoration-brass underline-offset-2">Lire les conditions générales de vente</Link>
        </p>
      </section>

      <section className="mt-12 grid gap-6" aria-label="Facturation et prélèvements">
        <EcheancierTable prelevements={echeancierPrevisionnel(echeancier, jourParis(new Date()))} />
        <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="font-bold">Mandat SEPA</dt>
          <dd>Réf. {mandat.reference} · IBAN {mandat.iban}</dd>
        </dl>
      </section>

      <div className="mt-10">
        <SignatureCommande jeton={jeton} />
      </div>
    </div>
  );
}
