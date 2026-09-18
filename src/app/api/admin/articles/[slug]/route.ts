import { NextResponse } from "next/server";
import matter from "gray-matter";
import { deleteContentFile, readContentFile, writeContentFile } from "@/lib/adminContent";

export const runtime = "nodejs";

function safeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/g, "");
}

interface ArticleInput {
  title: string;
  description: string;
  date: string;
  keywords: string;
  image?: string;
  imageAlt?: string;
  content: string;
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = safeSlug((await params).slug);
  const path = `content/articles/${slug}.mdx`;

  const existing = await readContentFile(path);
  if (existing === null) {
    return NextResponse.json({ ok: false, error: "Article introuvable." }, { status: 404 });
  }

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

  const frontmatter: Record<string, unknown> = {
    title,
    description: (body.description ?? "").trim(),
    date: (body.date ?? "").trim() || matter(existing).data.date,
    updated: new Date().toISOString().slice(0, 10),
    keywords: (body.keywords ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
  if (body.image?.trim()) frontmatter.image = body.image.trim();
  if (body.imageAlt?.trim()) frontmatter.imageAlt = body.imageAlt.trim();

  const file = matter.stringify(content + "\n", frontmatter);

  try {
    await writeContentFile(path, file, `admin: mise à jour de l'article « ${title} »`);
  } catch (err) {
    console.error("[admin/articles] écriture échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = safeSlug((await params).slug);
  const path = `content/articles/${slug}.mdx`;

  try {
    await deleteContentFile(path, `admin: suppression de l'article « ${slug} »`);
  } catch (err) {
    console.error("[admin/articles] suppression échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
