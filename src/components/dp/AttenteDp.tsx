"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Estimation {
  etat: "attente" | "dessin" | "termine" | "inconnu";
  restant: number;
  habituel: number;
}

interface Props {
  id: string;
  k: string;
  /** Création du dossier et heure du serveur à la dernière lecture (ms) : le minuteur ne dépend pas de l'horloge du téléphone. */
  cree: number;
  maintenantServeur: number;
}

const DUREE_DEFAUT_S = 190;
const RELANCES_MAX = 4;

const ETAPES: [number, string][] = [
  [0.15, "Lecture du cadastre, du PLU et des servitudes"],
  [0.4, "Altitudes du terrain et implantation du bassin"],
  [0.7, "Plan de masse coté et plan en coupe"],
  [0.88, "Cerfa 16702 et contrôles"],
  [1.01, "Mise en page et aperçu"],
];

const RAISONS: Record<Estimation["etat"], string> = {
  attente: "Votre dossier attend son tour sur nos serveurs de dessin.",
  dessin: "Le dessin est en cours : votre terrain demande un peu plus de travail.",
  termine: "C'est presque fini : nous récupérons vos plans.",
  inconnu: "Nos serveurs de dessin sont un peu chargés.",
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;

/**
 * Compte à rebours de la préparation du dossier (Dursun, 06/11/2026 : « trois minutes, les gens peuvent attendre avec
 * un minuteur »). Durée de départ : la durée habituelle des derniers dossiers. À zéro, si le dossier n'est pas prêt, on
 * demande à GitHub où il en est (en file, en dessin, fini) et on relance le minuteur avec le temps qu'il reste.
 */
export default function AttenteDp({ id, k, cree, maintenantServeur }: Props) {
  // décalage entre l'horloge du serveur et celle du téléphone
  const decalage = useRef(maintenantServeur - Date.now());
  const [fin, setFin] = useState(() => cree + DUREE_DEFAUT_S * 1000);
  const [debut, setDebut] = useState(cree);
  const [now, setNow] = useState(() => Date.now() + decalage.current);
  const [raison, setRaison] = useState<string | null>(null);
  const [relances, setRelances] = useState(0);
  const enCours = useRef(false);

  const estimer = useCallback(
    async (relance: boolean) => {
      if (enCours.current) return;
      enCours.current = true;
      try {
        const r = await fetch(`/api/dp-piscine/statut?${new URLSearchParams({ id, k, estimer: "1" })}`, { cache: "no-store" });
        const j = (await r.json()) as { estimation?: Estimation | null; maintenant?: number };
        if (j.maintenant) decalage.current = j.maintenant - Date.now();
        const maint = Date.now() + decalage.current;
        const e = j.estimation;
        if (relance) {
          setRelances((n) => n + 1);
          setRaison(e ? RAISONS[e.etat] : RAISONS.inconnu);
          setDebut(maint);
          setFin(maint + (e ? e.restant : 60) * 1000);
        } else if (e) {
          // premier calcul : durée habituelle des derniers dossiers, ou temps restant réel si le dessin a commencé
          setFin(e.etat === "dessin" || e.etat === "termine" ? maint + e.restant * 1000 : Math.max(maint + 30_000, cree + e.habituel * 1000));
        }
      } catch {
        if (relance) {
          const maint = Date.now() + decalage.current;
          setRelances((n) => n + 1);
          setRaison(RAISONS.inconnu);
          setDebut(maint);
          setFin(maint + 60_000);
        }
      } finally {
        enCours.current = false;
      }
    },
    [id, k, cree],
  );

  useEffect(() => {
    void estimer(false);
  }, [estimer]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + decalage.current), 1000);
    return () => clearInterval(t);
  }, []);

  const restant = Math.max(0, (fin - now) / 1000);
  // à zéro : nouvelle analyse, puis nouveau compte à rebours (quelques fois au plus)
  useEffect(() => {
    if (restant <= 0 && relances < RELANCES_MAX) void estimer(true);
  }, [restant <= 0, relances]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = Math.max(1, (fin - debut) / 1000);
  const fraction = Math.min(1, Math.max(0, 1 - restant / total));
  const fractionGlobale = relances ? Math.min(0.97, 0.85 + fraction * 0.12) : fraction;
  const etape = ETAPES.find(([f]) => fractionGlobale < f)?.[1] ?? ETAPES.at(-1)![1];
  const fini = restant <= 0 && relances >= RELANCES_MAX;

  return (
    <div className="grid gap-4">
      {raison && (
        <p className="max-w-[56ch] border-l-2 border-brass pl-4 text-[0.95rem] leading-relaxed">
          Ça prend un peu plus de temps que prévu. {raison}
        </p>
      )}
      {!fini ? (
        <div className="flex items-end gap-5">
          <p className="display text-6xl leading-none tabular-nums lining-nums" aria-live="off">{mmss(restant)}</p>
          <p className="pb-1 text-sm text-ink-2">{restant > 0 ? "temps restant estimé" : "nouvelle estimation…"}</p>
        </div>
      ) : (
        <p className="max-w-[56ch] text-[0.95rem] leading-relaxed">
          Votre dossier prend plus de temps que d&apos;habitude. Vous recevrez un e-mail dès qu&apos;il est prêt : vous
          pouvez fermer cette page.
        </p>
      )}
      <div className="h-1.5 w-full max-w-md overflow-hidden bg-stone-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fractionGlobale * 100)} aria-label="Avancement de la préparation">
        <div className="h-full bg-brass transition-[width] duration-1000 ease-linear" style={{ width: `${Math.round(fractionGlobale * 100)}%` }} />
      </div>
      <p className="text-sm text-ink-2" aria-live="polite">{etape}…</p>
    </div>
  );
}
