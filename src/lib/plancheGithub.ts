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
  const jeton = process.env.IDPLANS_GITHUB_TOKEN?.trim();
  if (!jeton) {
    console.warn("[planche] IDPLANS_GITHUB_TOKEN absent : planche non lancée", e.planche, e.parcelle);
    // En développement, les entrées complètes permettent de lancer l'outil à la main (essai de bout en bout).
    if (process.env.NODE_ENV !== "production") console.info("[planche] entrées du workflow", JSON.stringify(e));
    return false;
  }
  const depot = process.env.IDPLANS_GITHUB_REPO?.trim() || "Dursun242/id-plans";
  const ref = process.env.IDPLANS_GITHUB_REF?.trim() || "main";
  const r = await fetch(`${API}/repos/${depot}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: { ...entetes(jeton), "Content-Type": "application/json" },
    body: JSON.stringify({ ref, inputs: { ...e } }),
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
