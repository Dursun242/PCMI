import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_TYPES, MAX_FILE_BYTES } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Téléversement direct navigateur → Vercel Blob (jeton BLOB_READ_WRITE_TOKEN).
 * Sans jeton, renvoie 501 : le formulaire bascule en pièce jointe directe (3,5 Mo max).
 */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Stockage direct non configuré." }, { status: 501 });
  }
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_FILE_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async () => {
        /* rien : l'URL est renvoyée au navigateur, qui l'envoie avec le formulaire */
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
