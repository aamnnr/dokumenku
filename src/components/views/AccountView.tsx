"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Folder, HardDrive, LogOut, Shield, Users } from "lucide-react";
import { formatBytes } from "@/lib/file-types";
import { useApp } from "@/components/AppShell";
import PageHeader, { PageBody } from "@/components/PageHeader";
import InstallAppButton from "@/components/InstallAppButton";

/** Halaman Akun: profil pemilik, ringkasan pustaka, dan pengaturan. */
export default function AccountView() {
  const { userEmail, documents, categories } = useApp();
  const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
  const sharedCount = documents.filter((doc) => doc.share_public || doc.share_emails.length > 0).length;

  const stats = [
    { label: "Dokumen", value: String(documents.length), Icon: FileText },
    { label: "Kategori", value: String(categories.length), Icon: Folder },
    { label: "Total ukuran", value: formatBytes(totalSize), Icon: HardDrive },
    { label: "Dibagikan", value: String(sharedCount), Icon: Users },
  ];

  const rowBase = "w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors";
  const rowClass = `${rowBase} text-gray-700 hover:bg-gray-50 active:bg-gray-50`;

  return (
    <>
      <PageHeader title="Akun" />

      <PageBody width="narrow" className="space-y-5">
        <section className="motion-rise bg-white border border-gray-200/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{userEmail}</p>
            <p className="text-xs text-gray-500">Pemilik · masuk dengan Google</p>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, Icon }, index) => (
            <div
              key={label}
              style={{ "--i": index + 1 } as CSSProperties}
              className="motion-rise bg-white border border-gray-200/80 rounded-2xl p-4"
            >
              <Icon className="w-4 h-4 text-gray-400 mb-3" />
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{value}</p>
              <p className="text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </section>

        <section
          style={{ "--i": 5 } as CSSProperties}
          className="motion-rise bg-white border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100 [&_button]:rounded-none [&_button]:px-4 [&_button]:py-3.5"
        >
          <InstallAppButton />
          <Link href="/privacy" transitionTypes={["nav-forward"]} className={rowClass}>
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="flex-1">Kebijakan Privasi</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className={`${rowBase} text-red-600 hover:bg-red-50 active:bg-red-50`}>
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </section>

        <p className="text-[11px] text-gray-400 text-center">
          File tersimpan di Google Drive Anda; aplikasi hanya bisa mengakses file yang diunggah lewat Dokumenku.
        </p>
      </PageBody>
    </>
  );
}
