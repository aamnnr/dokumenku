import { NextResponse } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getAccessToken, getPickerConfig, toDriveError } from "@/lib/drive";

/**
 * Bekal untuk membuka Google Picker di browser pemilik: token akses Drive
 * (scope drive.file, berlaku ~1 jam), API key Picker, nomor project, dan
 * folder penyimpanan yang menjadi batas Picker.
 * File yang dipilih di Picker otomatis bisa diakses aplikasi, tanpa izin
 * ke seluruh isi Drive.
 */
export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const { apiKey, appId, folderId } = getPickerConfig();
    const accessToken = await getAccessToken();
    return NextResponse.json(
      { success: true, accessToken, apiKey, appId, folderId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Picker token error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal menyiapkan Google Drive"));
  }
}
