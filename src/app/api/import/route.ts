import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getDriveClient, getStorageFolderId, toDriveError } from "@/lib/drive";
import { getSupabase } from "@/lib/supabase";

/** Batas file per sekali impor. */
const MAX_IMPORT = 50;

type Skipped = { name: string; reason: string };

/**
 * Impor file yang sudah ada di Google Drive (dipilih lewat Google Picker).
 * File TIDAK disalin atau dipindahkan; hanya dicatat di database. Metadata
 * dibaca dari Drive sendiri. File dengan isi yang sama (MD5) tidak dicatat
 * dua kali, dan file milik pengguna tidak pernah dihapus di sini.
 *
 * Bila GOOGLE_DRIVE_FOLDER_ID diatur, hanya file yang berada LANGSUNG di
 * folder itu yang diterima. Subfolder tidak bisa diperiksa karena scope
 * drive.file tidak memberi akses ke folder yang dibuat di luar aplikasi.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const { fileIds, categoryId } = body;

    if (
      !Array.isArray(fileIds) ||
      fileIds.length === 0 ||
      !fileIds.every((id) => typeof id === "string" && /^[\w-]+$/.test(id))
    ) {
      return apiError("Pilih minimal satu file", 400);
    }
    if (fileIds.length > MAX_IMPORT) {
      return apiError(`Maksimal ${MAX_IMPORT} file sekali impor`, 400);
    }
    const hasCategory = categoryId !== undefined && categoryId !== null && categoryId !== "";
    if (hasCategory && typeof categoryId !== "string") {
      return apiError("Kategori tidak valid", 400);
    }

    const supabase = getSupabase();
    if (hasCategory) {
      const { data: category, error } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!category) return apiError("Kategori tidak ditemukan", 404);
    }

    const drive = getDriveClient();
    const storageFolderId = getStorageFolderId();
    const documentIds: string[] = [];
    const skipped: Skipped[] = [];
    let imported = 0;
    let existingCount = 0;

    for (const fileId of new Set(fileIds as string[])) {
      let file;
      try {
        ({ data: file } = await drive.files.get({
          fileId,
          fields: "id, name, size, mimeType, md5Checksum, trashed, parents",
          supportsAllDrives: true,
        }));
      } catch (driveError) {
        const status = (driveError as { code?: number }).code;
        if (status === 404 || status === 403) {
          skipped.push({ name: fileId, reason: "file tidak bisa diakses aplikasi" });
          continue;
        }
        throw toDriveError(driveError);
      }

      const name = file.name ?? "Tanpa judul";
      if (!file.id || file.trashed) {
        skipped.push({ name, reason: "file ada di Sampah" });
        continue;
      }
      if (storageFolderId && !file.parents?.includes(storageFolderId)) {
        skipped.push({ name, reason: "file berada di luar folder Dokumenku" });
        continue;
      }
      if (file.mimeType?.startsWith("application/vnd.google-apps.")) {
        skipped.push({
          name,
          reason: "Google Docs/Sheets/Slides belum didukung, unduh sebagai PDF dulu",
        });
        continue;
      }
      if (!file.md5Checksum) {
        skipped.push({ name, reason: "Drive tidak mengembalikan checksum file" });
        continue;
      }

      // Sudah tercatat (file yang sama, atau isi yang sama dari unggahan lain)?
      const { data: existing, error: lookupError } = await supabase
        .from("documents")
        .select("id")
        .or(`file_key.eq.${file.id},file_hash.eq.${file.md5Checksum}`)
        .limit(1)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);

      let documentId = existing?.id;
      if (documentId) {
        existingCount++;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("documents")
          .insert({
            title: name.slice(0, 255),
            file_key: file.id,
            file_size: Number(file.size ?? 0),
            mime_type: file.mimeType ?? "application/octet-stream",
            file_hash: file.md5Checksum,
          })
          .select("id")
          .single();

        if (insertError?.code === "23505") {
          // Isi yang sama baru saja dicatat (mis. dua salinan dalam satu impor).
          const { data: winner } = await supabase
            .from("documents")
            .select("id")
            .eq("file_hash", file.md5Checksum)
            .single();
          if (!winner) throw new Error(insertError.message);
          documentId = winner.id;
          existingCount++;
        } else if (insertError || !inserted) {
          throw new Error(insertError?.message ?? "Gagal mencatat dokumen");
        } else {
          documentId = inserted.id;
          imported++;
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
      documentIds.push(documentId);
    }

    if (documentIds.length === 0) {
      const reason = skipped[0]?.reason ?? "tidak ada file yang bisa diimpor";
      return apiError(`Tidak ada file yang diimpor: ${reason}.`, 422);
    }

    const parts: string[] = [];
    if (imported > 0) parts.push(`${imported} file diimpor`);
    if (existingCount > 0) {
      parts.push(`${existingCount} sudah ada${hasCategory ? " (ditautkan ke kategori)" : ""}`);
    }
    if (skipped.length > 0) parts.push(`${skipped.length} dilewati`);

    return NextResponse.json({
      success: true,
      documentIds,
      imported,
      existing: existingCount,
      skipped,
      message: `${parts.join(" · ")}.`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal mengimpor dari Google Drive"));
  }
}
