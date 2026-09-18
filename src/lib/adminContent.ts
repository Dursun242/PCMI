/**
 * Lecture/écriture des fichiers de contenu (articles MDX, data/*.ts) depuis
 * l'espace /admin.
 *
 * Sur Vercel, le système de fichiers est en lecture seule au runtime : un
 * écrit local ne survivrait pas au-delà de la requête et disparaîtrait au
 * prochain déploiement. On écrit donc directement dans le dépôt GitHub via
 * l'API Contents (ADMIN_GITHUB_TOKEN + ADMIN_GITHUB_REPO) ; Vercel redéploie
 * alors automatiquement, comme pour les articles générés par le moteur SEO.
 *
 * Sans ces variables (typiquement en local, `npm run dev`), on écrit
 * directement sur le disque : pratique pour tester avant de configurer
 * GitHub, mais à ne pas utiliser tel quel en production.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const GITHUB_TOKEN = process.env.ADMIN_GITHUB_TOKEN;
const GITHUB_REPO = process.env.ADMIN_GITHUB_REPO; // "owner/repo"
const GITHUB_BRANCH = process.env.ADMIN_GITHUB_BRANCH || "main";

export function isGithubConfigured(): boolean {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO);
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64(str: string): string {
  return Buffer.from(str, "utf8").toString("base64");
}

function fromBase64(str: string): string {
  return Buffer.from(str, "base64").toString("utf8");
}

async function githubGetFile(path: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(GITHUB_BRANCH)}`,
    { headers: githubHeaders(), cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub: lecture de ${path} impossible (${res.status})`);
  const data = (await res.json()) as { content: string; sha: string };
  return { content: fromBase64(data.content.replace(/\n/g, "")), sha: data.sha };
}

async function githubPutFile(path: string, content: string, message: string): Promise<void> {
  const existing = await githubGetFile(path);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch: GITHUB_BRANCH,
      sha: existing?.sha,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub: écriture de ${path} impossible (${res.status}) ${body}`);
  }
}

async function githubDeleteFile(path: string, message: string): Promise<void> {
  const existing = await githubGetFile(path);
  if (!existing) return;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "DELETE",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha: existing.sha, branch: GITHUB_BRANCH }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub: suppression de ${path} impossible (${res.status}) ${body}`);
  }
}

/** `path` est relatif à la racine du dépôt, ex. "content/articles/mon-slug.mdx" */
export async function readContentFile(path: string): Promise<string | null> {
  if (isGithubConfigured()) {
    const file = await githubGetFile(path);
    return file?.content ?? null;
  }
  const abs = join(process.cwd(), path);
  return existsSync(abs) ? readFileSync(abs, "utf8") : null;
}

export async function writeContentFile(path: string, content: string, message: string): Promise<void> {
  if (isGithubConfigured()) {
    await githubPutFile(path, content, message);
    return;
  }
  const abs = join(process.cwd(), path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
}

export async function deleteContentFile(path: string, message: string): Promise<void> {
  if (isGithubConfigured()) {
    await githubDeleteFile(path, message);
    return;
  }
  const abs = join(process.cwd(), path);
  if (existsSync(abs)) unlinkSync(abs);
}
