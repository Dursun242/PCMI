/**
 * Rappel affiché après l'envoi d'un formulaire (Dursun, 02/11/2026 : « dis aux
 * gens, quand ils ont envoyé le formulaire, de vérifier quand même les spams ») :
 * l'e-mail du site peut arriver dans les courriers indésirables ; le marquer
 * « Non spam » fait arriver les suivants dans la boîte de réception.
 */
export function RappelSpams({ className = "" }: { className?: string }) {
  return (
    <p role="note" className={`border-l-2 border-brass bg-stone px-4 py-3 text-sm leading-relaxed text-ink-2 ${className}`}>
      <strong className="text-ink">Vous ne voyez pas notre e-mail&nbsp;?</strong> Regardez dans vos courriers indésirables
      (spams) et marquez-le «&nbsp;Non spam&nbsp;» : nos prochains messages arriveront directement dans votre boîte de
      réception.
    </p>
  );
}
