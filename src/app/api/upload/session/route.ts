import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { createResumableUploadSession } from "@/lib/drive";
import { getRequestOrigin } from "@/lib/google-oauth";
import { getSupabase } from "@/lib/supabase";

/**
 * Langkah 1 unggah: validasi lalu buat sesi resumable upload di Google Drive.
 * Isi file TIDAK melewati server ini; browser mengirimnya langsung ke Drive.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const { title, mimeType, size, categoryId } = body;

    if (typeof title !== "string" || !title.trim()) {
      return apiError("Nama dokumen wajib diisi", 400);
    }
    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
      return apiError("File kosong tidak dapat diunggah", 400);
    }
    if (size > MAX_UPLOAD_BYTES) {
      return apiError(`Ukuran file maksimal ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`, 413);
    }
    if (typeof categoryId !== "string" || !categoryId) {
      return apiError("Kategori wajib dipilih", 400);
    }

    const { data: category, error } = await getSupabase()
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!category) return apiError("Kategori tidak ditemukan", 404);

    const uploadUrl = await createResumableUploadSession({
      name: title.trim().slice(0, 255),
      mimeType:
        typeof mimeType === "string" && mimeType ? mimeType : "application/octet-stream",
      size,
      origin: request.headers.get("origin") ?? getRequestOrigin(request),
    });

    return NextResponse.json({ success: true, uploadUrl });
  } catch (error) {
    console.error("Upload session error:", error);
    return apiError(getErrorMessage(error, "Gagal menyiapkan unggahan"));
  }
}
