#!/usr/bin/env node
/**
 * Membuat folder tujuan unggahan di Google Drive lalu menyimpan ID-nya ke
 * GOOGLE_DRIVE_FOLDER_ID di .env.local.
 *
 * Folder harus dibuat oleh aplikasi ini (bukan manual di Drive), karena scope
 * drive.file hanya memberi akses ke file/folder yang dibuat aplikasi.
 * Setelah dibuat, folder boleh di-rename atau dipindah di Drive; ID-nya tetap.
 *
 * Pakai:  npm run drive:folder              -> folder "Dokumenku"
 *         npm run drive:folder -- "Arsip"   -> nama lain
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";

const ENV_PATH = resolve(process.cwd(), ".env.local");
const FOLDER_MIME = "application/vnd.google-apps.folder";
const folderName = (process.argv[2] ?? "Dokumenku").trim();

function readEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const env = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function writeEnvValue(key, value) {
  const content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
  const next = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(ENV_PATH, next);
}

const env = readEnv();
for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]) {
  if (!env[key]) {
    console.error(`✗ ${key} belum ada di .env.local` +
      (key === "GOOGLE_REFRESH_TOKEN" ? " (jalankan `npm run drive:token`)" : ""));
    process.exit(1);
  }
}

const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

try {
  // Jika folder yang tercatat masih ada, pakai itu.
  if (env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      const { data } = await drive.files.get({
        fileId: env.GOOGLE_DRIVE_FOLDER_ID,
        fields: "id, name, mimeType, trashed",
      });
      if (data.mimeType === FOLDER_MIME && !data.trashed) {
        console.log(`✓ Folder "${data.name}" sudah terpasang. Tidak ada yang diubah.`);
        process.exit(0);
      }
    } catch {
      console.log("! GOOGLE_DRIVE_FOLDER_ID lama tidak bisa diakses aplikasi, membuat folder baru…");
    }
  }

  // Pakai ulang folder bernama sama yang dulu dibuat aplikasi ini.
  const escaped = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const { data: found } = await drive.files.list({
    q: `mimeType='${FOLDER_MIME}' and name='${escaped}' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  let folder = found.files?.[0];
  if (folder) {
    console.log(`✓ Memakai folder "${folder.name}" yang sudah ada.`);
  } else {
    const { data } = await drive.files.create({
      requestBody: { name: folderName, mimeType: FOLDER_MIME },
      fields: "id, name",
    });
    folder = data;
    console.log(`✓ Folder "${folder.name}" dibuat di My Drive.`);
  }

  writeEnvValue("GOOGLE_DRIVE_FOLDER_ID", folder.id);
  console.log("✓ GOOGLE_DRIVE_FOLDER_ID disimpan ke .env.local");
  console.log("  Untuk Vercel: salin nilainya ke Project → Settings → Environment Variables.");
  console.log("  Restart `npm run dev` agar nilai baru terbaca.");
} catch (error) {
  const message = error?.response?.data?.error?.message ?? error?.message ?? String(error);
  if (/has not been used|is disabled/i.test(message)) {
    console.error("✗ Google Drive API belum diaktifkan di project Google Cloud.");
    console.error("  Aktifkan di APIs & Services → Library → Google Drive API → Enable,");
    console.error("  tunggu 1–2 menit, lalu jalankan ulang perintah ini.");
  } else if (message.includes("invalid_grant")) {
    console.error("✗ Refresh token kedaluwarsa/dicabut. Jalankan `npm run drive:token` lagi.");
  } else {
    console.error("✗ Gagal:", message);
  }
  process.exit(1);
}
