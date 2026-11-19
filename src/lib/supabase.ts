import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Klien Supabase KHUSUS SERVER. Memakai service role key (tanpa prefiks
 * NEXT_PUBLIC_) sehingga tidak pernah terkirim ke browser, dan tabel bisa
 * dikunci total dari anon key lewat RLS (lihat supabase/schema.sql).
 */
export function getSupabase(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "SUPABASE_SERVICE_ROLE_KEY di .env.local / Vercel."
    );
  }

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
