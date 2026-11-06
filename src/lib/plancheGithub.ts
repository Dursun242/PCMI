import "server-only";
import type { Planche } from "@/lib/planche";

/**
 * Déclenche le workflow « Planche gratuite » du dépôt id-plans, qui dessine la
 * planche avec l'outil PCMI d'ID Maîtrise et la renvoie à l'adresse de rappel.
 *
 * Variables : IDPLANS_GITHUB_TOKEN (jeton à grain fin, dépôt id-plans seul,
 * droit « Actions : lecture et écriture »), et facultativement
 * IDPLANS_GITHUB_REPO (défaut Dursun242/id-plans), IDPLANS_GITHUB_REF (main).
 */

const WORKFLOW = "planche-gratuite.yml";

export interface EntreesWorkflow {
  planche: Planche;
  adresse: string;
  ville: string;
  client: string;
  parcelle: string;
  rappel: string;
}

export const githubConfigure = () => Boolean(process.env.IDPLANS_GITHUB_TOKEN);

const API = "https://api.github.com";

const entetes = (jeton: string) => ({
  Authorization: `Bearer ${jeton}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export interface EchecGithub {
  depot: string;
  ref: string;
  statut: number;
  corps: string;
  /** Statut HTTP de GET /repos/{depot} avec le même jeton (null si non vérifié). */
  statutDepot: number | null;
  /** Portées d'un jeton classique (en-tête x-oauth-scopes), null pour un jeton à grain fin. */
  portees: string | null;
}

/** Message lisible par Dursun : ce que GitHub a répondu et ce qu'il faut corriger. */
export function messageEchecGithub(e: EchecGithub): string {
  const base = `GitHub : HTTP ${e.statut} sur ${e.depot} (branche ${e.ref}). ${e.corps.slice(0, 160)}`;
  const classique = e.portees !== null;
  let conseil = "";
  if (e.statut === 401) conseil = "Le jeton est invalide ou expiré : en recréer un et le recoller dans Vercel.";
  else if (e.statut === 404 && e.statutDepot !== null && e.statutDepot !== 200) {
    conseil = classique
      ? `Jeton classique sans accès au dépôt privé (portées : « ${e.portees || "aucune"} ») : il faut la portée « repo » et « workflow », ou un jeton à grain fin.`
      : `Le jeton ne voit pas le dépôt ${e.depot} : dans le jeton à grain fin, « Resource owner » = Dursun242 et « Repository access » doit inclure id-plans. Vérifier aussi IDPLANS_GITHUB_REPO dans Vercel (à supprimer ou égale à Dursun242/id-plans).`;
  } else if (e.statut === 404) {
    conseil = `Le dépôt est visible mais le workflow planche-gratuite.yml est introuvable sur ${e.ref} (vérifier IDPLANS_GITHUB_REF).`;
  } else if (e.statut === 403) {
    conseil = classique
      ? "Jeton classique : ajouter la portée « workflow »."
      : "Le jeton voit le dépôt mais n'a pas le droit « Actions : Read and write ».";
  }
  return conseil ? `${base}\n${conseil}` : base;
}

async function statutDepot(depot: string, jeton: string): Promise<number | null> {
  try {
    const r = await fetch(`${API}/repos/${depot}`, { headers: entetes(jeton), signal: AbortSignal.timeout(5_000) });
    return r.status;
  } catch {
    return null;
  }
}

/** Renvoie false sans jeton (en local) ; lève une erreur lisible si GitHub refuse. */
export async function declencherPlanche(e: EntreesWorkflow): Promise<boolean> {
  return declencherWorkflow(WORKFLOW, { ...e });
}

/**
 * Lance un workflow d'id-plans (planche gratuite, DP piscine…). Renvoie false
 * sans jeton (en local) ; lève une erreur lisible si GitHub refuse.
 */
export async function declencherWorkflow(fichier: string, inputs: Record<string, string>): Promise<boolean> {
  const jeton = process.env.IDPLANS_GITHUB_TOKEN?.trim();
  if (!jeton) {
    console.warn(`[github] IDPLANS_GITHUB_TOKEN absent : ${fichier} non lancé`);
    // En développement, les entrées complètes permettent de lancer l'outil à la main (essai de bout en bout).
    if (process.env.NODE_ENV !== "production") console.info(`[github] entrées de ${fichier}`, JSON.stringify(inputs));
    return false;
  }
  const depot = process.env.IDPLANS_GITHUB_REPO?.trim() || "Dursun242/id-plans";
  const ref = process.env.IDPLANS_GITHUB_REF?.trim() || "main";
  const r = await fetch(`${API}/repos/${depot}/actions/workflows/${fichier}/dispatches`, {
    method: "POST",
    headers: { ...entetes(jeton), "Content-Type": "application/json" },
    body: JSON.stringify({ ref, inputs }),
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status === 204) return true;
  throw new Error(
    messageEchecGithub({
      depot,
      ref,
      statut: r.status,
      corps: await r.text(),
      statutDepot: r.status === 404 ? await statutDepot(depot, jeton) : null,
      portees: r.headers.get("x-oauth-scopes"),
    }),
  );
}

/* ---------- Estimation du temps restant (compte à rebours de la DP piscine) ---------- */

export interface EstimationRun {
  /** attente : en file chez GitHub ; dessin : en cours ; termine : fini, envoi au site en cours ; inconnu : pas trouvé. */
  etat: "attente" | "dessin" | "termine" | "inconnu";
  /** Secondes restantes estimées. */
  restant: number;
  /** Durée habituelle d'un dossier (médiane des derniers), en secondes. */
  habituel: number;
}

interface RunGithub {
  status: string;
  conclusion: string | null;
  created_at: string;
  run_started_at?: string;
  updated_at: string;
}

export const DUREE_DEFAUT_S = 190;

/**
 * Où en est le dossier lancé à l'instant `depuis` (ms) : le premier passage du workflow créé après lui, et la durée
 * habituelle (médiane de création -> fin des derniers passages réussis, bornée à 1 min 30 - 10 min). Pure.
 */
export function estimer(runs: RunGithub[], depuis: number, maintenant = Date.now()): EstimationRun {
  const t = (s?: string) => (s ? Date.parse(s) : NaN);
  const durees = runs
    .filter((r) => r.status === "completed" && r.conclusion === "success")
    .map((r) => (t(r.updated_at) - t(r.created_at)) / 1000)
    .filter((d) => Number.isFinite(d) && d > 0)
    .sort((a, b) => a - b);
  const median = durees.length ? durees[Math.floor(durees.length / 2)] : DUREE_DEFAUT_S;
  const habituel = Math.round(Math.min(600, Math.max(90, median)));
  const le = [...runs].filter((r) => t(r.created_at) >= depuis - 20_000).sort((a, b) => t(a.created_at) - t(b.created_at))[0];
  if (!le) return { etat: "inconnu", restant: Math.max(30, Math.round(habituel - (maintenant - depuis) / 1000)), habituel };
  if (le.status === "completed") return { etat: "termine", restant: 20, habituel };
  if (le.status !== "in_progress") return { etat: "attente", restant: habituel, habituel };
  const ecoule = (maintenant - t(le.created_at)) / 1000;
  return { etat: "dessin", restant: Math.max(20, Math.round(habituel - ecoule)), habituel };
}

/** Derniers passages d'un workflow d'id-plans, puis estimation ; null sans jeton ou si GitHub ne répond pas. */
export async function estimationWorkflow(fichier: string, depuis: number): Promise<EstimationRun | null> {
  const jeton = process.env.IDPLANS_GITHUB_TOKEN?.trim();
  if (!jeton) return null;
  const depot = process.env.IDPLANS_GITHUB_REPO?.trim() || "Dursun242/id-plans";
  try {
    const r = await fetch(`${API}/repos/${depot}/actions/workflows/${fichier}/runs?per_page=20`, {
      headers: entetes(jeton),
      signal: AbortSignal.timeout(6_000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const { workflow_runs: runs } = (await r.json()) as { workflow_runs?: RunGithub[] };
    return estimer(runs ?? [], depuis);
  } catch {
    return null;
  }
}
