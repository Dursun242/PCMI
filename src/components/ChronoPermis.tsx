/** Du PLU à l'accord : ce que le bureau fait, dans l'ordre (dit par le gérant). */
const ETAPES: [quand: string, titre: string, texte: string][] = [
  ["Avant de dessiner", "Lecture du PLU", "Les règles de votre parcelle : zone du PLU, lotissement, servitudes, risques. Rien n'est dessiné avant."],
  ["Avec nos dessinateurs", "Plans et pièces du dossier", "Plans, façades, coupe, notice, insertion, CERFA, attestations : toutes les pièces administratives, préparées puis vérifiées."],
  ["Le dépôt", "Dépôt en mairie", "Le dossier part sur le guichet numérique de votre commune ; vous recevez le récépissé."],
  ["L'instruction", "Suivi de l'instruction", "Une pièce demandée, une question du service urbanisme : nous répondons, dans les délais."],
  ["L'accord", "Arrêté de permis", "La mairie accorde le permis : votre maison peut se construire."],
  ["Jusqu'au bout", "Affichage et délai de recours", "Le panneau sur le terrain, puis les deux mois de recours des tiers : nous vous disons quand votre permis est définitif."],
];

/**
 * Chronologie verticale : un fil laiton se trace au défilement et chaque étape
 * s'allume quand elle arrive à l'écran (styles « .chrono » dans app/motion.css).
 * Sans animation (navigateur ancien, mouvement réduit), tout est simplement affiché.
 */
export default function ChronoPermis() {
  return (
    <div className="chrono relative">
      <span className="chrono-fil" aria-hidden="true" />
      <ol data-stagger className="grid gap-8">
        {ETAPES.map(([quand, titre, texte], i) => (
          <li key={titre} className="chrono-etape relative pl-10">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bronze">
              {String(i + 1).padStart(2, "0")} · {quand}
            </p>
            <p className="display mt-1 text-2xl leading-tight">{titre}</p>
            <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-ink-2">{texte}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
