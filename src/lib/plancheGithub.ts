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

/** Renvoie false sans jeton (en local) ; lève une erreur si GitHub refuse. */
export async function declencherPlanche(e: EntreesWorkflow): Promise<boolean> {
  const jeton = process.env.IDPLANS_GITHUB_TOKEN;
  if (!jeton) {
    console.warn("[planche] IDPLANS_GITHUB_TOKEN absent : planche non lancée", e.planche, e.parcelle);
    // En développement, les entrées complètes permettent de lancer l'outil à la main (essai de bout en bout).
    if (process.env.NODE_ENV !== "production") console.info("[planche] entrées du workflow", JSON.stringify(e));
    return false;
  }
  const depot = process.env.IDPLANS_GITHUB_REPO || "Dursun242/id-plans";
  const r = await fetch(`https://api.github.com/repos/${depot}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jeton}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: process.env.IDPLANS_GITHUB_REF || "main", inputs: { ...e } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status !== 204) throw new Error(`GitHub : HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return true;
}
