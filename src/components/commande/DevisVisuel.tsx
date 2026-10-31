import Image from "next/image";
import { formatCentimes, type Prelevement } from "@/lib/commande";
import { formatFrDate } from "@/lib/format";
import type { Devis } from "@/lib/qonto";

const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
const pourcent = (taux: number) => `${Math.round(taux * 100)} %`;

/**
 * Aperçu du devis tel que Qonto l'a établi (mêmes lignes, mêmes montants que
 * le PDF), présenté comme le document que le client signe. Le PDF officiel
 * reste accessible par le lien sous l'aperçu.
 */
export function DevisVisuel({ devis }: { devis: Devis }) {
  return (
    <article className="border border-stone-2 bg-white p-5 text-[0.9rem] text-ink shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] sm:p-10" aria-label={`Devis n° ${devis.numero}`}>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devis</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs">
            <dt className="font-bold">Numéro de devis</dt>
            <dd>{devis.numero}</dd>
            <dt className="font-bold">Date d&apos;émission</dt>
            <dd>{formatFrDate(devis.dateEmission)}</dd>
            <dt className="font-bold">Date d&apos;expiration</dt>
            <dd>{formatFrDate(devis.dateExpiration)}</dd>
          </dl>
        </div>
        <Image src="/brand/logo-black.png" alt="ID Maîtrise" width={2374} height={591} className="h-8 w-auto sm:h-10" />
      </header>

      <div className="mt-8 grid gap-6 text-xs sm:grid-cols-2">
        <address className="not-italic">
          <strong className="block text-sm">{devis.emetteur.nom}</strong>
          {devis.emetteur.adresse}
          <br />
          {devis.emetteur.ville}
          {devis.emetteur.siret && (
            <>
              <br />
              SIRET {devis.emetteur.siret}
            </>
          )}
        </address>
        <address className="not-italic">
          <strong className="block text-sm">{devis.client.nom}</strong>
          {devis.client.adresse}
          <br />
          {devis.client.ville}
          <br />
          {devis.client.email}
        </address>
      </div>

      {/* Sur téléphone, quantité, prix unitaire et TVA passent sous le libellé : le tableau tient dans l'écran. */}
      <div className="mt-8">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-ink text-paper">
              <th scope="col" className="px-3 py-2 text-left">Description</th>
              <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">Qté</th>
              <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">Prix unitaire HT</th>
              <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">TVA</th>
              <th scope="col" className="px-3 py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l) => (
              <tr key={l.titre} className="border-b border-stone-2 align-top">
                <td className="px-3 py-3">
                  <span className="font-bold">{l.titre}</span>
                  {l.description && <span className="mt-1 block whitespace-pre-line text-ink-2">{l.description}</span>}
                  <span className="mt-1 block text-ink-2 sm:hidden">
                    {l.quantite} × {euros(l.prixUnitaireHT)} HT · TVA {pourcent(l.tauxTVA)}
                  </span>
                </td>
                <td className="hidden px-3 py-3 text-right sm:table-cell">{l.quantite}</td>
                <td className="hidden px-3 py-3 text-right whitespace-nowrap sm:table-cell">{euros(l.prixUnitaireHT)}</td>
                <td className="hidden px-3 py-3 text-right sm:table-cell">{pourcent(l.tauxTVA)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">{euros(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-xs">
        <dt className="font-bold">Total HT</dt>
        <dd className="text-right">{euros(devis.totalHT)}</dd>
        <dt className="font-bold">Montant total de la TVA</dt>
        <dd className="text-right">{euros(devis.totalTVA)}</dd>
        <dt className="bg-stone px-2 py-2 text-sm font-bold">Total TTC</dt>
        <dd className="bg-stone px-2 py-2 text-right text-sm font-bold">{euros(devis.totalTTC)}</dd>
      </dl>

      {devis.pied && <p className="mt-6 text-xs">{devis.pied}</p>}
      {devis.conditions && (
        <p className="mt-6 whitespace-pre-line border-t border-stone-2 pt-4 text-[0.68rem] leading-relaxed text-ink-2">{devis.conditions}</p>
      )}
    </article>
  );
}

/** Échéancier prévisionnel : dates au plus tôt, l'échéancier démarrant après la validation du projet. */
export function EcheancierTable({ prelevements }: { prelevements: Prelevement[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-3 text-left">
        <span className="display block text-2xl">Votre échéancier</span>
        <span className="text-ink-2">Dates au plus tôt : le premier prélèvement n&apos;intervient qu&apos;après la validation de votre projet.</span>
      </caption>
      <thead>
        <tr className="border-b border-ink text-left">
          <th scope="col" className="py-2 pr-4">Prélèvement</th>
          <th scope="col" className="py-2 pr-4">Au plus tôt le</th>
          <th scope="col" className="py-2 text-right">Montant</th>
        </tr>
      </thead>
      <tbody>
        {prelevements.map((p) => (
          <tr key={p.numero} className="border-b border-stone-2">
            <td className="py-2 pr-4">{p.numero} / {prelevements.length}</td>
            <td className="py-2 pr-4">{formatFrDate(p.jour)}</td>
            <td className="numeral py-2 text-right">{formatCentimes(p.montantCentimes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
