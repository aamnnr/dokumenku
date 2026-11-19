import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getDriveClient, toDriveError } from "@/lib/drive";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const fileKey = new URL(request.url).searchParams.get("fileKey");
  if (!fileKey) {
    return apiError("File key diperlukan", 400);
  }

  try {
    // Pastikan hanya file yang tercatat di database yang bisa dibuka.
    const { data: document, error: lookupError } = await getSupabase()
      .from("documents")
      .select("id")
      .eq("file_key", fileKey)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }
    if (!document) {
      return apiError("Dokumen tidak ditemukan", 404);
    }

    const metadata = await getDriveClient().files.get({
      fileId: fileKey,
      fields: "webViewLink, webContentLink, mimeType",
    });

    const url = metadata.data.webViewLink || metadata.data.webContentLink;
    if (!url) {
      return apiError("Gagal mendapatkan tautan file dari Google Drive", 404);
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Preview error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal menghasilkan tautan file"));
  }
}
