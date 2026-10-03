import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_TYPES, MAX_FILE_BYTES, ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

/** Jetons d'envoi par visiteur et par fenêtre de 10 min (un dossier compte rarement plus de 10 pièces). */
const MAX_TOKENS_PER_WINDOW = 20;

/**
 * Téléversement direct navigateur → Vercel Blob (jeton BLOB_READ_WRITE_TOKEN).
 * Sans jeton, renvoie 501 : le formulaire bascule en pièce jointe directe (3,5 Mo max).
 */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Stockage direct non configuré." }, { status: 501 });
  }
  try {
    const body = (await req.json()) as HandleUploadBody;
    // Seule la demande de jeton vient du navigateur ; l'avis de fin d'envoi vient de Vercel.
    if (body.type === "blob.generate-client-token" && rateLimited(`upload:${ipOf(req)}`, MAX_TOKENS_PER_WINDOW)) {
      return NextResponse.json({ error: "Trop d'envois. Réessayez dans quelques minutes." }, { status: 429 });
    }
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
    console.error("[upload]", err);
    return NextResponse.json({ error: "Envoi du fichier impossible." }, { status: 400 });
  }
}
