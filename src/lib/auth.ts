import { cookies } from "next/headers";
import { apiError } from "@/lib/api";
import { SESSION_COOKIE, verifySessionToken, type Session } from "@/lib/session";

/** Baca sesi pemilik dari cookie request. `null` jika belum login. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Dipanggil di awal setiap route handler. Proxy sudah memblokir request tanpa
 * sesi, tetapi pengecekan diulang di dekat data sebagai lapisan kedua.
 */
export async function requireOwner(): Promise<
  { session: Session; response?: never } | { session?: never; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return { response: apiError("Sesi berakhir. Silakan masuk kembali.", 401) };
  }
  return { session };
}
