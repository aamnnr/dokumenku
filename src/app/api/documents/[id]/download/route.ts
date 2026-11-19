import { NextResponse, type NextRequest } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getDriveClient, toDriveError } from "@/lib/drive";
import { findDocument } from "@/lib/sharing";

/**
 * Unduh dokumen: arahkan browser ke tautan unduhan resmi Google Drive.
 * File diunduh langsung dari Google sehingga tidak terkena batas ukuran
 * respons server (mis. 4,5 MB di Vercel). Browser harus login ke akun
 * Google pemilik.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/documents/[id]/download">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  try {
    const document = await findDocument(id);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);

    const { data } = await getDriveClient().files.get({
      fileId: document.file_key,
      fields: "webContentLink",
    });
    if (!data.webContentLink) {
      return apiError("File ini tidak menyediakan tautan unduhan dari Google Drive", 404);
    }
    return NextResponse.redirect(data.webContentLink, 302);
  } catch (error) {
    console.error("Download error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal mengunduh dokumen"));
  }
}
