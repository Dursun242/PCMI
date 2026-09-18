import { NextResponse } from "next/server";
import matter from "gray-matter";
import { readContentFile, writeContentFile } from "@/lib/adminContent";

export const runtime = "nodejs";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface ArticleInput {
  slug?: string;
  title: string;
  description: string;
  date: string;
  keywords: string;
  image?: string;
  imageAlt?: string;
  content: string;
}

export async function POST(req: Request) {
  let body: ArticleInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const content = (body.content ?? "").trim();
  if (!title || !content) {
    return NextResponse.json({ ok: false, error: "Titre et contenu obligatoires." }, { status: 400 });
  }

  const slug = slugify(body.slug || title);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Impossible de déduire un slug valide." }, { status: 400 });
  }

  const path = `content/articles/${slug}.mdx`;
  const existing = await readContentFile(path);
  if (existing !== null) {
    return NextResponse.json({ ok: false, error: `Un article existe déjà avec le slug « ${slug} ».` }, { status: 409 });
  }

  const frontmatter: Record<string, unknown> = {
    title,
    description: (body.description ?? "").trim(),
    date: (body.date ?? "").trim() || new Date().toISOString().slice(0, 10),
    keywords: (body.keywords ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
  if (body.image?.trim()) frontmatter.image = body.image.trim();
  if (body.imageAlt?.trim()) frontmatter.imageAlt = body.imageAlt.trim();

  const file = matter.stringify(content + "\n", frontmatter);

  try {
    await writeContentFile(path, file, `admin: nouvel article « ${title} »`);
  } catch (err) {
    console.error("[admin/articles] écriture échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, slug });
}
