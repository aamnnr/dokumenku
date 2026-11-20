import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { deleteDriveFile, getDriveClient, toDriveError } from "@/lib/drive";
import { getSupabase } from "@/lib/supabase";

/**
 * Langkah 2 unggah: browser sudah selesai mengirim file ke Drive.
 * Metadata (ukuran, MD5) dibaca dari Drive sendiri, bukan dari klien, lalu
 * dicatat di database. File dengan MD5 sama tidak disimpan dua kali.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const { fileId, categoryId } = body;

    if (typeof fileId !== "string" || !/^[\w-]+$/.test(fileId)) {
      return apiError("ID file tidak valid", 400);
    }
    // Kategori opsional: tanpa kategori, dokumen tetap tersimpan.
    const hasCategory = categoryId !== undefined && categoryId !== null && categoryId !== "";
    if (hasCategory && typeof categoryId !== "string") {
      return apiError("Kategori tidak valid", 400);
    }

    const supabase = getSupabase();

    // Scope drive.file: hanya file yang dibuat aplikasi ini yang bisa dibaca.
    const { data: file } = await getDriveClient().files.get({
      fileId,
      fields: "id, name, size, mimeType, md5Checksum, trashed",
    });

    const size = Number(file.size ?? 0);
    if (!file.id || file.trashed) {
      return apiError("File tidak ditemukan di Google Drive", 404);
    }
    if (size > MAX_UPLOAD_BYTES) {
      await deleteDriveFile(file.id);
      return apiError(`Ukuran file maksimal ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`, 413);
    }
    if (!file.md5Checksum) {
      return apiError("Google Drive tidak mengembalikan checksum file", 502);
    }

    if (hasCategory) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId as string)
        .maybeSingle();
      if (categoryError) throw new Error(categoryError.message);
      if (!category) {
        await deleteDriveFile(file.id);
        return apiError("Kategori tidak ditemukan", 404);
      }
    }

    // Idempoten: jika request ini terkirim ulang, pakai baris yang sudah ada.
    const { data: existing, error: lookupError } = await supabase
      .from("documents")
      .select("id, file_key")
      .or(`file_key.eq.${file.id},file_hash.eq.${file.md5Checksum}`)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    let documentId = existing?.id;
    const isDuplicate = Boolean(existing && existing.file_key !== file.id);

    if (existing && existing.file_key !== file.id) {
      // Konten sama sudah ada: hapus salinan baru di Drive.
      await deleteDriveFile(file.id);
    }

    if (!documentId) {
      const { data: inserted, error: insertError } = await supabase
        .from("documents")
        .insert({
          title: file.name ?? "Tanpa judul",
          file_key: file.id,
          file_size: size,
          mime_type: file.mimeType ?? "application/octet-stream",
          file_hash: file.md5Checksum,
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Unggahan bersamaan dengan konten sama menang lebih dulu.
          const { data: winner } = await supabase
            .from("documents")
            .select("id")
            .eq("file_hash", file.md5Checksum)
            .single();
          await deleteDriveFile(file.id);
          if (!winner) throw new Error(insertError.message);
          documentId = winner.id;
        } else {
          await deleteDriveFile(file.id);
          throw new Error(insertError.message);
        }
      } else {
        documentId = inserted.id;
      }
    }

    if (hasCategory) {
      const { error: linkError } = await supabase
        .from("document_categories")
        .upsert(
          { document_id: documentId, category_id: categoryId as string },
          { onConflict: "document_id,category_id" }
        );
      if (linkError) throw new Error(linkError.message);
    }

    let message = "File berhasil diunggah ke Google Drive dan dicatat di database.";
    if (isDuplicate) {
      message = hasCategory
        ? "File sudah ada di Drive. Dokumen hanya ditautkan ke kategori ini tanpa duplikasi."
        : "File yang sama sudah tersimpan, jadi tidak diunggah dua kali.";
    }

    return NextResponse.json({
      success: true,
      documentId,
      deduplicated: isDuplicate,
      message,
    });
  } catch (error) {
    console.error("Upload complete error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal menyimpan dokumen"));
  }
}
