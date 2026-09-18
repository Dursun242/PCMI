import { NextResponse } from "next/server";
import { writeBinaryContentFile } from "@/lib/adminContent";

export const runtime = "nodejs";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 4 * 1024 * 1024;

function slugifyBase(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Fichier manquant." }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json({ ok: false, error: "Format non supporté (jpg, png, webp, svg)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Fichier trop volumineux (4 Mo max)." }, { status: 400 });
  }

  const base = slugifyBase(file.name.replace(/\.[^.]+$/, "")) || "image";
  const filename = `${Date.now()}-${base}.${ext}`;
  const path = `public/uploads/${filename}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await writeBinaryContentFile(path, bytes.toString("base64"), `admin: ajout de l'image ${filename}`);
  } catch (err) {
    console.error("[admin/upload] écriture échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, path: `/uploads/${filename}` });
}
