import { formatCentimes, mensualites } from "@/lib/commande";

type Props = {
  prixTTC: number;
  /** Sur fond sombre (hero vert). */
  sombre?: boolean;
  className?: string;
};

/**
 * Sous un prix : le paiement le plus étalé en avant (« ou 10 × 149 € sans
 * frais »), puis les autres fractionnements et le devis immédiat.
 */
export default function PaiementFractionne({ prixTTC, sombre = false, className = "" }: Props) {
  const [plusLong, ...autres] = mensualites(prixTTC);
  if (!plusLong) return null;
  const discret = sombre ? "text-paper/75" : "text-ink-2";
  const fort = sombre ? "text-paper" : "text-ink";
  const accent = sombre ? "text-brass-2" : "text-bronze";
  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className={discret}>ou</span>
        <span className={`numeral text-2xl ${fort}`}>
          {plusLong.nombre}&nbsp;×&nbsp;{formatCentimes(plusLong.montantCentimes)}
        </span>
        <span className={`text-xs font-bold uppercase tracking-[0.12em] ${accent}`}>sans frais</span>
      </p>
      <p className={`mt-1 text-sm ${discret}`}>
        {autres.map((e) => (
          <span key={e.nombre}>
            ou {e.nombre}&nbsp;×&nbsp;{formatCentimes(e.montantCentimes)} ·{" "}
          </span>
        ))}
        <strong className={fort}>Devis immédiat</strong>, signé en ligne
      </p>
    </div>
  );
}
