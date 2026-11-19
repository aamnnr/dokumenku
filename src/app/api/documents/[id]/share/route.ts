import { NextResponse, type NextRequest } from "next/server";
import { apiError, getErrorMessage } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getDriveClient, toDriveError } from "@/lib/drive";
import { isOwnerEmail } from "@/lib/session";
import { findDocument, mirrorShareState, readShareState, toShareError } from "@/lib/sharing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EXPIRY_DAYS = 365;

/** Status berbagi saat ini (dibaca dari Google Drive). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/documents/[id]/share">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  try {
    const document = await findDocument(id);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);

    const state = await readShareState(document.file_key);
    await mirrorShareState(id, state);
    return NextResponse.json({ success: true, share: state });
  } catch (error) {
    console.error("Share read error:", error);
    return apiError(getErrorMessage(toDriveError(error), "Gagal membaca status berbagi"));
  }
}

/**
 * Ubah izin berbagi.
 * body:
 *   { action: "public-on" | "public-off" }
 *   { action: "add-email", email, expiresInDays?: number, message?: string }
 *   { action: "remove-email", permissionId }
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/documents/[id]/share">) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  try {
    const body = ((await request.json()) ?? {}) as Record<string, unknown>;
    const document = await findDocument(id);
    if (!document) return apiError("Dokumen tidak ditemukan", 404);

    const drive = getDriveClient();
    const fileId = document.file_key;
    const current = await readShareState(fileId);
    let message = "Pengaturan berbagi diperbarui";

    switch (body.action) {
      case "public-on": {
        if (!current.public) {
          await drive.permissions.create({
            fileId,
            requestBody: { type: "anyone", role: "reader", allowFileDiscovery: false },
          });
        }
        message = "Tautan publik aktif. Siapa saja yang punya tautan bisa melihat file ini.";
        break;
      }

      case "public-off": {
        const { data } = await drive.permissions.list({ fileId, fields: "permissions(id, type)" });
        await Promise.all(
          (data.permissions ?? [])
            .filter((p) => p.type === "anyone" && p.id)
            .map((p) => drive.permissions.delete({ fileId, permissionId: p.id! }))
        );
        message = "Tautan publik dinonaktifkan. Tautan lama tidak bisa dibuka lagi.";
        break;
      }

      case "add-email": {
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (!EMAIL_RE.test(email)) return apiError("Alamat email tidak valid", 400);
        if (isOwnerEmail(email)) return apiError("Itu email pemilik; Anda sudah punya akses.", 400);
        if (current.emails.some((e) => e.email === email)) {
          return apiError("Email ini sudah punya akses", 409);
        }

        const days = Number(body.expiresInDays ?? 0);
        if (!Number.isFinite(days) || days < 0 || days > MAX_EXPIRY_DAYS) {
          return apiError("Masa berlaku tidak valid", 400);
        }
        const note = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";

        await drive.permissions.create({
          fileId,
          sendNotificationEmail: true,
          ...(note ? { emailMessage: note } : {}),
          requestBody: {
            type: "user",
            role: "reader",
            emailAddress: email,
            ...(days > 0
              ? { expirationTime: new Date(Date.now() + days * 86_400_000).toISOString() }
              : {}),
          },
        });
        message = `Akses dikirim ke ${email}. Google akan mengirim email pemberitahuan.`;
        break;
      }

      case "remove-email": {
        const permissionId = typeof body.permissionId === "string" ? body.permissionId : "";
        // Hanya izin email yang tercatat yang boleh dicabut (bukan pemilik).
        if (!current.emails.some((e) => e.permissionId === permissionId)) {
          return apiError("Akses tidak ditemukan", 404);
        }
        await drive.permissions.delete({ fileId, permissionId });
        message = "Akses dicabut.";
        break;
      }

      default:
        return apiError("Aksi tidak dikenal", 400);
    }

    const state = await readShareState(fileId);
    await mirrorShareState(id, state);
    return NextResponse.json({ success: true, message, share: state });
  } catch (error) {
    console.error("Share update error:", error);
    return apiError(getErrorMessage(toShareError(toDriveError(error)), "Gagal mengubah izin berbagi"));
  }
}
