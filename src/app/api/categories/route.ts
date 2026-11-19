import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const body: unknown = await request.json();
    const { name, description } = (body ?? {}) as {
      name?: unknown;
      description?: unknown;
    };

    if (typeof name !== "string" || !name.trim()) {
      return apiError("Nama kategori wajib diisi", 400);
    }

    const cleanDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const { data, error } = await getSupabase()
      .from("categories")
      .insert({ name: name.trim(), description: cleanDescription })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return apiError("Kategori dengan nama tersebut sudah ada", 409);
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dibuat",
      category: data,
    });
  } catch (error) {
    console.error("Category error:", error);
    return apiError(getErrorMessage(error, "Gagal membuat kategori"));
  }
}
