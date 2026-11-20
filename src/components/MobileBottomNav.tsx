"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Home, Plus, Star, User } from "lucide-react";
import { navTypes, useApp } from "@/components/AppShell";

const TABS = [
  { href: "/", label: "Beranda", Icon: Home },
  { href: "/favorit", label: "Favorit", Icon: Star },
  { href: "/kategori", label: "Kategori", Icon: Folder },
  { href: "/akun", label: "Akun", Icon: User },
] as const;

/**
 * Navigasi bawah untuk layar kecil (pengganti sidebar). Setiap tab adalah
 * halaman sendiri; tombol + di tengah adalah aksi (sheet unggah).
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { openUpload } = useApp();

  const tab = ({ href, label, Icon }: (typeof TABS)[number]) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        transitionTypes={navTypes(pathname, href)}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          // Ketuk tab aktif = gulir ke atas.
          if (active) window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
          active ? "text-gray-900" : "text-gray-400 active:text-gray-700"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-transform duration-200 ${active ? "scale-110 -translate-y-px" : ""}`}
          strokeWidth={active ? 2.25 : 1.75}
        />
        <span
          aria-hidden
          className={`absolute top-1 h-1 w-1 rounded-full bg-indigo-600 transition-all duration-200 ${
            active ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        />
        {label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      data-bottom-nav
      style={{ viewTransitionName: "bottom-nav", viewTransitionClass: "anchor" }}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch h-16 px-2">
        {tab(TABS[0])}
        {tab(TABS[1])}

        <div className="flex-1 flex items-center justify-center">
          <button
            type="button"
            onClick={openUpload}
            aria-label="Unggah dokumen"
            className="press w-12 h-12 -mt-5 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-900/20 hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
