import { NextResponse, type NextRequest } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * Ganti nama dan/atau deskripsi kategori.
 * body: { name?: string, description?: string | null }
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/categories/[id]">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return apiError("ID kategori tidak valid", 400);

  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const update: { name?: string; description?: string | null } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return apiError("Nama kategori wajib diisi", 400);
      }
      update.name = body.name.trim().slice(0, 100);
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== "string") {
        return apiError("Deskripsi tidak valid", 400);
      }
      update.description = body.description?.trim().slice(0, 200) || null;
    }
    if (Object.keys(update).length === 0) return apiError("Tidak ada perubahan", 400);

    const { data, error } = await getSupabase()
      .from("categories")
      .update(update)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") return apiError("Kategori dengan nama tersebut sudah ada", 409);
      throw new Error(error.message);
    }
    if (!data) return apiError("Kategori tidak ditemukan", 404);

    return NextResponse.json({ success: true, message: "Kategori berhasil diperbarui" });
  } catch (error) {
    console.error("Update category error:", error);
    return apiError(getErrorMessage(error, "Gagal memperbarui kategori"));
  }
}

/**
 * Hapus kategori. Dokumennya TIDAK ikut terhapus: hanya tautannya yang
 * hilang (ON DELETE CASCADE di document_categories). Dokumen yang tidak
 * punya kategori lain menjadi "tanpa kategori".
 */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/categories/[id]">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return apiError("ID kategori tidak valid", 400);

  try {
    const { data, error } = await getSupabase()
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return apiError("Kategori tidak ditemukan", 404);

    return NextResponse.json({
      success: true,
      message: "Kategori dihapus. Dokumen di dalamnya tetap tersimpan.",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return apiError(getErrorMessage(error, "Gagal menghapus kategori"));
  }
}
