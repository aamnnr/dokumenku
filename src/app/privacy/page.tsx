import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Dokumenku",
};

export default function PrivacyPage() {
  return (
    <PageTransition>
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-12">
      <article className="max-w-2xl mx-auto bg-white border border-gray-200/80 rounded-2xl p-8 space-y-5 text-sm text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-semibold text-gray-900">Kebijakan Privasi</h1>
        <p className="text-xs text-gray-400">Berlaku sejak 19 November 2026</p>

        <p>
          Dokumenku adalah aplikasi pribadi untuk mengelola dokumen milik pemiliknya sendiri.
          Aplikasi ini tidak terbuka untuk pendaftaran umum.
        </p>

        <h2 className="text-base font-semibold text-gray-900">Data yang digunakan</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Alamat email Google</strong>: hanya untuk memastikan bahwa yang masuk adalah
            pemilik aplikasi. Email tidak disimpan di database.
          </li>
          <li>
            <strong>Google Drive</strong>: aplikasi memakai izin <code>drive.file</code>, sehingga
            hanya dapat mengakses file yang diunggah melalui aplikasi ini. File lain di Drive
            tidak dapat dibaca.
          </li>
          <li>
            <strong>Metadata dokumen</strong> (judul, ukuran, jenis file, kategori, dan sidik jari
            MD5 untuk mencegah duplikasi) disimpan di database Supabase.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-gray-900">Berbagi data</h2>
        <p>
          Data tidak dijual, tidak dibagikan kepada pihak ketiga, dan tidak dipakai untuk iklan.
          Penggunaan data dari Google API mematuhi Google API Services User Data Policy, termasuk
          ketentuan Limited Use.
        </p>

        <h2 className="text-base font-semibold text-gray-900">Menghapus akses</h2>
        <p>
          Akses aplikasi ke akun Google dapat dicabut kapan saja melalui{" "}
          <a
            href="https://myaccount.google.com/permissions"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>

        <p className="pt-4">
          <Link href="/" transitionTypes={["nav-back"]} className="text-blue-600 hover:underline">
            ← Kembali ke Dokumenku
          </Link>
        </p>
      </article>
    </main>
    </PageTransition>
  );
}
