import { google } from "googleapis";

type DriveClient = ReturnType<typeof google.drive>;
type OAuthClient = InstanceType<typeof google.auth.OAuth2>;

let cachedAuth: OAuthClient | null = null;
let cachedClient: DriveClient | null = null;

function getAuth(): OAuthClient {
  if (cachedAuth) return cachedAuth;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Konfigurasi Google Drive belum lengkap. Isi GOOGLE_CLIENT_ID, " +
        "GOOGLE_CLIENT_SECRET, dan GOOGLE_REFRESH_TOKEN (jalankan `npm run drive:token`)."
    );
  }

  cachedAuth = new google.auth.OAuth2(clientId, clientSecret);
  cachedAuth.setCredentials({ refresh_token: refreshToken });
  return cachedAuth;
}

/**
 * Klien Google Drive dengan kredensial refresh token.
 * Token akses di-refresh otomatis oleh googleapis.
 */
export function getDriveClient(): DriveClient {
  if (!cachedClient) {
    cachedClient = google.drive({ version: "v3", auth: getAuth() });
  }
  return cachedClient;
}

async function getAccessToken(): Promise<string> {
  try {
    const { token } = await getAuth().getAccessToken();
    if (!token) throw new Error("Token akses Google Drive kosong.");
    return token;
  } catch (error) {
    throw toDriveError(error);
  }
}

/**
 * Membuat sesi resumable upload. Browser lalu mengirim isi file langsung ke
 * URL ini, tanpa melewati server (menghindari batas body 4,5 MB di Vercel).
 * Header Origin wajib agar Google mengizinkan CORS dari browser.
 */
export async function createResumableUploadSession(options: {
  name: string;
  mimeType: string;
  size: number;
  origin: string;
}): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": options.mimeType,
        "X-Upload-Content-Length": String(options.size),
        Origin: options.origin,
      },
      body: JSON.stringify({
        name: options.name,
        mimeType: options.mimeType,
        ...(folderId ? { parents: [folderId] } : {}),
      }),
    }
  );

  const location = response.headers.get("location");
  if (!response.ok || !location) {
    const detail = await response.text().catch(() => "");
    console.error("Resumable session error:", response.status, detail);
    throw new Error("Gagal membuat sesi unggah ke Google Drive.");
  }
  return location;
}

/** Ubah error googleapis menjadi pesan yang bisa ditindaklanjuti. */
export function toDriveError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message.includes("invalid_grant")) {
    return new Error(
      "Token Google Drive kedaluwarsa atau dicabut. Buat token baru dengan " +
        "`npm run drive:token`, lalu perbarui GOOGLE_REFRESH_TOKEN."
    );
  }
  return error instanceof Error ? error : new Error("Kesalahan Google Drive.");
}

export async function deleteDriveFile(fileId: string) {
  try {
    await getDriveClient().files.delete({ fileId });
  } catch (cleanupError) {
    console.error("Gagal menghapus file Drive yang tidak terpakai:", cleanupError);
  }
}
