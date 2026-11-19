import { getDriveClient } from "@/lib/drive";
import { getSupabase } from "@/lib/supabase";
import { UNDEFINED_COLUMN } from "@/lib/queries";

export interface ShareEmail {
  permissionId: string;
  email: string;
  /** ISO string, atau null bila tanpa batas waktu. */
  expiresAt: string | null;
}

export interface ShareState {
  public: boolean;
  /** Tautan untuk dibuka penerima (halaman pratinjau Google Drive). */
  link: string | null;
  emails: ShareEmail[];
}

/** Ambil dokumen milik aplikasi (pastikan ID ada di database). */
export async function findDocument(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await getSupabase()
    .from("documents")
    .select("id, title, file_key, file_size, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Baca izin berbagi langsung dari Google Drive (sumber kebenaran). */
export async function readShareState(fileKey: string): Promise<ShareState> {
  const drive = getDriveClient();
  const [{ data: file }, { data: list }] = await Promise.all([
    drive.files.get({ fileId: fileKey, fields: "webViewLink" }),
    drive.permissions.list({
      fileId: fileKey,
      fields: "permissions(id, type, role, emailAddress, expirationTime)",
    }),
  ]);

  const permissions = list.permissions ?? [];
  return {
    public: permissions.some((p) => p.type === "anyone"),
    link: file.webViewLink ?? null,
    emails: permissions
      .filter((p) => p.type === "user" && p.role !== "owner" && p.emailAddress && p.id)
      .map((p) => ({
        permissionId: p.id!,
        email: p.emailAddress!.toLowerCase(),
        expiresAt: p.expirationTime ?? null,
      }))
      .sort((a, b) => a.email.localeCompare(b.email)),
  };
}

/**
 * Simpan cermin status berbagi ke database untuk lencana di UI.
 * Bila migrasi belum dijalankan, lewati tanpa menggagalkan request.
 */
export async function mirrorShareState(documentId: string, state: ShareState) {
  const { error } = await getSupabase()
    .from("documents")
    .update({ share_public: state.public, share_emails: state.emails.map((e) => e.email) })
    .eq("id", documentId);
  if (error && error.code !== UNDEFINED_COLUMN) {
    console.error("Gagal menyimpan status berbagi:", error.message);
  }
}

/** Pesan error Drive yang lebih bisa dipahami untuk aksi berbagi. */
export function toShareError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/expiration/i.test(message)) {
    return new Error("Google Drive menolak masa berlaku akses ini. Coba tanpa batas waktu atau maksimal 1 tahun.");
  }
  if (/invalid.*(email|user)|emailAddress/i.test(message)) {
    return new Error("Alamat email tidak valid atau tidak bisa menerima akses Google Drive.");
  }
  return error instanceof Error ? error : new Error("Gagal mengubah izin berbagi.");
}
