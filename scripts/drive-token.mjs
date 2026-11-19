#!/usr/bin/env node
/**
 * Membuat GOOGLE_REFRESH_TOKEN untuk Google Drive dan menuliskannya langsung
 * ke .env.local (token tidak ditampilkan di layar).
 *
 * Pakai:  npm run drive:token
 * Syarat: - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET sudah ada di .env.local
 *         - http://localhost:3000/api/auth/callback terdaftar sebagai
 *           Authorized redirect URI di Google Cloud Console
 *         - `npm run dev` sedang TIDAK berjalan (port 3000 dipakai skrip ini)
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";

const ENV_PATH = resolve(process.cwd(), ".env.local");
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/api/auth/callback`;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

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
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("✗ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum ada di .env.local");
  process.exit(1);
}

const client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
const state = randomUUID();
const authUrl = client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // wajib agar Google selalu mengirim refresh token
  scope: [SCOPE],
  state,
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT_URI);
  if (url.pathname !== "/api/auth/callback") {
    res.writeHead(404).end();
    return;
  }

  const finish = (status, message) => {
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<p style="font-family:sans-serif">${message}</p>`);
    server.close();
  };

  if (url.searchParams.get("state") !== state) {
    finish(400, "State tidak cocok. Jalankan ulang skrip.");
    console.error("✗ State tidak cocok.");
    process.exitCode = 1;
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    finish(400, "Otorisasi dibatalkan.");
    console.error("✗ Otorisasi dibatalkan:", url.searchParams.get("error"));
    process.exitCode = 1;
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      finish(500, "Google tidak mengirim refresh token. Lihat terminal.");
      console.error(
        "✗ Refresh token kosong. Cabut akses aplikasi di " +
          "https://myaccount.google.com/permissions lalu jalankan ulang."
      );
      process.exitCode = 1;
      return;
    }
    writeEnvValue("GOOGLE_REFRESH_TOKEN", tokens.refresh_token);
    finish(200, "✓ Berhasil. Token disimpan ke .env.local. Tab ini boleh ditutup.");
    console.log("✓ GOOGLE_REFRESH_TOKEN disimpan ke .env.local");
    console.log("  Untuk Vercel: salin nilainya ke Project → Settings → Environment Variables.");
  } catch (error) {
    finish(500, "Gagal menukar kode otorisasi. Lihat terminal.");
    console.error("✗ Gagal menukar kode:", error?.response?.data ?? error?.message ?? error);
    process.exitCode = 1;
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`✗ Port ${PORT} sedang dipakai. Hentikan \`npm run dev\` dulu.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log("Buka link berikut di browser dan login dengan akun pemilik Drive:\n");
  console.log(authUrl + "\n");
  console.log("Menunggu otorisasi…");
});
