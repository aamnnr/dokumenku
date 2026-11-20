import { NextResponse, type NextRequest } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getDriveClient, toDriveError } from "@/lib/drive";
import { getSupabase } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * Ubah nama dokumen dan/atau daftar kategorinya.
 * body: { title?: string, categoryIds?: string[] }
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/documents/[id]">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return apiError("ID dokumen tidak valid", 400);

  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const supabase = getSupabase();

    const { data: document, error: findError } = await supabase
      .from("documents")
      .select("id, file_key, title")
      .eq("id", id)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);

    // --- Nama ---
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return apiError("Nama dokumen wajib diisi", 400);
      }
      const title = body.title.trim().slice(0, 255);
      if (title !== document.title) {
        const { error } = await supabase.from("documents").update({ title }).eq("id", id);
        if (error) throw new Error(error.message);
        // Samakan nama file di Drive; kegagalan di sini tidak membatalkan rename.
        try {
          await getDriveClient().files.update({ fileId: document.file_key, requestBody: { name: title } });
        } catch (driveError) {
          console.error("Gagal mengganti nama file di Drive:", driveError);
        }
      }
    }

    // --- Kategori ---
    if (body.categoryIds !== undefined) {
      const ids = Array.isArray(body.categoryIds)
        ? [...new Set(body.categoryIds.filter((v): v is string => typeof v === "string" && UUID_RE.test(v)))]
        : null;
      if (!ids) return apiError("Daftar kategori tidak valid", 400);

      if (ids.length === 0) {
        // Lepas dari semua kategori: dokumen tetap ada sebagai "tanpa kategori".
        const { error } = await supabase.from("document_categories").delete().eq("document_id", id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: "Dokumen berhasil diperbarui" });
      }

      const { data: found, error: catError } = await supabase
        .from("categories")
        .select("id")
        .in("id", ids);
      if (catError) throw new Error(catError.message);
      if ((found ?? []).length !== ids.length) return apiError("Kategori tidak ditemukan", 404);

      const { error: upsertError } = await supabase
        .from("document_categories")
        .upsert(
          ids.map((category_id) => ({ document_id: id, category_id })),
          { onConflict: "document_id,category_id" }
        );
      if (upsertError) throw new Error(upsertError.message);

      const { error: deleteError } = await supabase
        .from("document_categories")
        .delete()
        .eq("document_id", id)
        .not("category_id", "in", `(${ids.join(",")})`);
      if (deleteError) throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true, message: "Dokumen berhasil diperbarui" });
  } catch (error) {
    console.error("Update document error:", error);
    return apiError(getErrorMessage(error, "Gagal memperbarui dokumen"));
  }
}

/** Hapus dokumen: file ke Sampah Google Drive, baris database dihapus. */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/documents/[id]">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return apiError("ID dokumen tidak valid", 400);

  try {
    const supabase = getSupabase();
    const { data: document, error: findError } = await supabase
      .from("documents")
      .select("id, file_key")
      .eq("id", id)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);

    // Pindahkan ke Sampah Drive dulu (bisa dipulihkan 30 hari). Jika file sudah
    // tidak ada (404), lanjutkan saja agar penghapusan bisa diulang dengan aman.
    try {
      await getDriveClient().files.update({
        fileId: document.file_key,
        requestBody: { trashed: true },
      });
    } catch (driveError) {
      const status = (driveError as { code?: number; status?: number }).code ??
        (driveError as { status?: number }).status;
      if (status !== 404) throw toDriveError(driveError);
    }

    // Relasi kategori ikut terhapus lewat ON DELETE CASCADE.
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Dokumen dihapus dan dipindahkan ke Sampah Google Drive",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return apiError(getErrorMessage(error, "Gagal menghapus dokumen"));
  }
}
