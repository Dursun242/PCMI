import { Resend } from "resend";
import { site } from "@/config/site";

export interface MailAttachment {
  filename: string;
  content?: Buffer;
  path?: string; // URL publique (fichier déjà stocké)
}

/* Limitation de débit en mémoire, partagée par tous les formulaires */
const hits = new Map<string, { n: number; t: number }>();
export function rateLimited(ip: string, max = 6) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 10 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > max;
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

const FONT = "font-family:Lato,Arial,sans-serif";

/** Tableau HTML clé/valeur pour les e-mails internes. */
export function table(rows: [string, string][]) {
  return `<table style="border-collapse:collapse;${FONT};font-size:15px">${rows
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#5a645e;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-weight:700;vertical-align:top">${esc(v)}</td></tr>`)
    .join("")}</table>`;
}

export function section(title: string, inner: string) {
  return `<h3 style="${FONT};font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a9884f;margin:22px 0 6px">${esc(title)}</h3>${inner}`;
}

export function attachmentsList(files: { name: string; url?: string; size?: number }[]) {
  if (!files.length) return "";
  return `<ul style="${FONT};font-size:14px;padding-left:18px">${files
    .map((f) => `<li>${f.url ? `<a href="${esc(f.url)}">${esc(f.name)}</a>` : esc(f.name)}${f.size ? ` <span style="color:#939b96">(${Math.round(f.size / 1024)} Ko)</span>` : ""}</li>`)
    .join("")}</ul>`;
}

export function clientWrap(inner: string) {
  return `<div style="${FONT};font-size:16px;line-height:1.6;color:#1b1f1d;max-width:560px">${inner}<p>À très vite,<br><strong>${esc(site.legal.director)}</strong><br>${esc(site.parent)} — maître d'œuvre<br>${esc(site.address.street)}, ${esc(site.address.zip)} ${esc(site.address.city)}</p></div>`;
}

/**
 * Envoie l'e-mail interne + l'accusé de réception au client.
 * Sans RESEND_API_KEY : log serveur et retour { dev: true }.
 */
export async function sendPair(opts: {
  subject: string;
  internalHtml: string;
  replyTo: string;
  clientSubject: string;
  clientHtml: string;
  attachments?: MailAttachment[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? `${site.name} <contact@id-maitrise.com>`;
  const to = process.env.MAIL_TO ?? site.email;
  if (!apiKey) {
    console.warn(`[mail] RESEND_API_KEY absente — non envoyé : ${opts.subject}`);
    return { dev: true };
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.internalHtml,
    attachments: opts.attachments?.map((a) => (a.content ? { filename: a.filename, content: a.content } : { filename: a.filename, path: a.path! })),
  });
  await resend.emails.send({ from, to: opts.replyTo, replyTo: to, subject: opts.clientSubject, html: opts.clientHtml });
  return { dev: false };
}

/* ---------- Fichiers ---------- */
export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "application/zip", "application/x-zip-compressed", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/acad", "image/vnd.dwg", "application/dxf"];
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // via stockage direct
export const MAX_INLINE_TOTAL = 3.5 * 1024 * 1024; // en pièce jointe directe (limite Vercel 4,5 Mo)

export interface UploadedRef {
  name: string;
  url: string;
  size: number;
}

/** Lit les fichiers d'un FormData (champ "files") et les références déjà stockées (champ "uploaded", JSON). */
export async function collectFiles(form: FormData): Promise<{ inline: MailAttachment[]; refs: UploadedRef[]; error?: string }> {
  const inline: MailAttachment[] = [];
  const refs: UploadedRef[] = [];
  let total = 0;
  for (const f of form.getAll("files")) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_FILE_BYTES) return { inline, refs, error: `« ${f.name} » dépasse 25 Mo.` };
    total += f.size;
    if (total > MAX_INLINE_TOTAL) return { inline, refs, error: "Pièces jointes trop volumineuses pour un envoi direct (3,5 Mo max au total). Réessayez : le stockage direct prendra le relais." };
    inline.push({ filename: f.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 120), content: Buffer.from(await f.arrayBuffer()) });
  }
  try {
    const parsed = JSON.parse(String(form.get("uploaded") ?? "[]")) as UploadedRef[];
    for (const r of parsed) {
      if (typeof r.url === "string" && /^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\//.test(r.url)) refs.push({ name: String(r.name).slice(0, 120), url: r.url, size: Number(r.size) || 0 });
    }
  } catch {}
  return { inline, refs };
}
