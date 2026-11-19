import { google } from "googleapis";

/**
 * Redirect URI login dihitung dari origin request agar otomatis benar di
 * localhost maupun di Vercel. Daftarkan keduanya di Google Cloud Console:
 *   http://localhost:3000/api/auth/callback
 *   https://<domain-vercel>/api/auth/callback
 */
export function getLoginRedirectUri(origin: string): string {
  return `${origin}/api/auth/callback`;
}

export function createOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET wajib diisi.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Origin publik aplikasi (memperhitungkan proxy Vercel). */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  return url.origin;
}
