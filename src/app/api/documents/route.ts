import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getCategoriesWithDocuments } from "@/lib/queries";

export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const categories = await getCategoriesWithDocuments();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Fetch error:", error);
    return apiError(getErrorMessage(error, "Gagal memuat data"));
  }
}
