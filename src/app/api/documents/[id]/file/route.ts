import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { SHARE_FILE_MAX_BYTES } from "@/lib/constants";
import { getDriveClient, toDriveError } from "@/lib/drive";
import { findDocument } from "@/lib/sharing";

/**
 * Isi file mentah, dipakai untuk "Kirim file" lewat lembar bagikan perangkat
 * (Web Share API). Dibatasi ukurannya karena melewati server.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/documents/[id]/file">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  try {
    const document = await findDocument(id);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);
    if (document.file_size > SHARE_FILE_MAX_BYTES) {
      return apiError(
        `File terlalu besar untuk dikirim langsung (maks. ${SHARE_FILE_MAX_BYTES / 1024 / 1024} MB). Bagikan tautannya saja.`,
        413
      );
    }

    const response = await getDriveClient().files.get(
      { fileId: document.file_key, alt: "media" },
      { responseType: "stream" }
    );
    const body = Readable.toWeb(response.data as Readable) as ReadableStream<Uint8Array>;

    return new Response(body, {
      headers: {
        "Content-Type": document.mime_type || "application/octet-stream",
        "Content-Length": String(document.file_size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.title)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("File stream error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal mengambil file"));
  }
}
