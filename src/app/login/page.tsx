import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import BrandMark from "@/components/ui/BrandMark";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Masuk — Dokumenku",
};

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Akun Google ini tidak diizinkan. Hanya pemilik yang bisa masuk.",
  cancelled: "Proses masuk dibatalkan.",
  state: "Sesi masuk kedaluwarsa. Silakan coba lagi.",
  google: "Gagal memverifikasi akun Google. Silakan coba lagi.",
  config: "Konfigurasi login belum lengkap di server.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <PageTransition>
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="motion-rise w-full max-w-sm bg-white border border-gray-200/80 rounded-2xl p-8 shadow-xs">
        <div className="mb-8">
          <BrandMark />
        </div>

        <h1 className="text-xl font-semibold text-gray-900">Masuk</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Gunakan akun Google pemilik untuk mengelola dokumen.
        </p>

        <Suspense fallback={null}>
          <LoginError searchParams={searchParams} />
        </Suspense>

        {/* Link biasa (bukan <Link>) agar browser mengikuti redirect ke Google. */}
        <a
          href="/api/auth/login"
          className="press w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm"
        >
          <GoogleIcon />
          Masuk dengan Google
        </a>

        <p className="text-[11px] text-gray-400 mt-6 text-center">
          <Link href="/privacy" transitionTypes={["nav-forward"]} className="hover:underline">
            Kebijakan Privasi
          </Link>
        </p>
      </div>
    </main>
    </PageTransition>
  );
}

async function LoginError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const key = Array.isArray(error) ? error[0] : error;
  if (!key) return null;

  return (
    <p className="motion-rise mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      {ERROR_MESSAGES[key] ?? "Terjadi kesalahan saat masuk."}
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
