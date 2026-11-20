"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, FolderPlus, Home, LogOut, Star, UploadCloud } from "lucide-react";
import { navTypes, useApp } from "@/components/AppShell";
import BrandMark from "@/components/ui/BrandMark";
import InstallAppButton from "@/components/InstallAppButton";

/** Sidebar khusus desktop/tablet. Di mobile diganti navigasi bawah. */
export default function Sidebar() {
  const pathname = usePathname();
  const { categories, favorites, openFolder, openUpload, createCategory, toggleFavorite, themeFor, userEmail } =
    useApp();
  const favoriteCategories = categories.filter((category) => favorites.includes(category.id));

  const navClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
      active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const navLink = (href: string, label: string, Icon: typeof Home) => {
    // Halaman folder (/kategori/...) termasuk bagian tab Kategori.
    const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
    return (
      <Link
        href={href}
        transitionTypes={navTypes(pathname, href)}
        aria-current={pathname === href ? "page" : undefined}
        className={navClass(active)}
      >
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 bg-white border-r border-gray-200/80 flex-col justify-between">
      <div className="p-5 overflow-y-auto">
        <div className="mb-8">
          <BrandMark />
        </div>

        <nav className="space-y-1">
          {navLink("/", "Semua Berkas", Home)}
          {navLink("/favorit", "Favorit", Star)}
          {navLink("/kategori", "Kategori", Folder)}
        </nav>

        <div className="mt-4 space-y-1">
          <button onClick={openUpload} className={navClass(false)}>
            <UploadCloud className="w-4 h-4" />
            Unggah Dokumen
          </button>
          <button onClick={createCategory} className={navClass(false)}>
            <FolderPlus className="w-4 h-4" />
            Buat Kategori
          </button>
        </div>

        <div className="my-6 border-t border-gray-100" />

        <p className="px-3 text-xs font-medium text-gray-400 mb-3">Favorit</p>
        {favoriteCategories.length === 0 ? (
          <p className="px-3 text-xs text-gray-400">Klik ikon bintang pada folder untuk menyematkannya di sini.</p>
        ) : (
          <div className="space-y-1">
            {favoriteCategories.map((category) => {
              const active = pathname === `/kategori/${category.id}`;
              return (
                <div
                  key={category.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                    active ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => openFolder(category.id)}
                    className="flex items-center gap-2.5 truncate flex-1 text-left"
                  >
                    <span className={`w-5 h-5 rounded-md shrink-0 ${themeFor(category.id).swatch}`} />
                    <span className="truncate">{category.name}</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(category.id)}
                    className="p-1 text-amber-400 hover:text-amber-500 transition"
                    aria-label="Hapus dari Favorit"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="px-4 [&_button]:py-2 [&_button]:text-xs">
          <InstallAppButton />
        </div>
        <div
          className={`p-3 m-4 mt-2 rounded-2xl border flex items-center gap-2.5 transition ${
            pathname === "/akun" ? "bg-gray-100 border-gray-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100/70"
          }`}
        >
          <Link
            href="/akun"
            transitionTypes={navTypes(pathname, "/akun")}
            className="flex items-center gap-2.5 min-w-0 flex-1"
            aria-label="Buka halaman akun"
          >
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800 truncate">{userEmail}</p>
              <p className="text-[11px] text-gray-400">Pemilik</p>
            </div>
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              aria-label="Keluar"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
