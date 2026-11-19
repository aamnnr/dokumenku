import React from "react";
import { FolderPlus, Home, LogOut, Star, UploadCloud } from "lucide-react";
import type { CategoryWithDocs } from "@/types";
import BrandMark from "@/components/ui/BrandMark";
import InstallAppButton from "@/components/InstallAppButton";

interface SidebarProps {
  selectedFolderId: string;
  onSelectFolder: (id: string | "ALL") => void;
  onOpenUpload: () => void;
  onOpenCategory: () => void;
  categories: CategoryWithDocs[];
  favorites: string[];
  onToggleFavorite: (catId: string) => void;
  favoriteColors: string[];
  userEmail: string;
}

/** Sidebar khusus desktop/tablet. Di mobile diganti navigasi bawah. */
export default function Sidebar({
  selectedFolderId,
  onSelectFolder,
  onOpenUpload,
  onOpenCategory,
  categories,
  favorites,
  onToggleFavorite,
  favoriteColors,
  userEmail,
}: SidebarProps) {
  const favoriteCategories = categories.filter((category) => favorites.includes(category.id));
  const navClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
      active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 bg-white border-r border-gray-200/80 flex-col justify-between">
      <div className="p-5 overflow-y-auto">
        <div className="mb-8">
          <BrandMark />
        </div>

        <nav className="space-y-1">
          <button onClick={() => onSelectFolder("ALL")} className={navClass(selectedFolderId === "ALL")}>
            <Home className="w-4 h-4" />
            Semua Berkas
          </button>
          <button onClick={onOpenUpload} className={navClass(false)}>
            <UploadCloud className="w-4 h-4" />
            Unggah Dokumen
          </button>
          <button onClick={onOpenCategory} className={navClass(false)}>
            <FolderPlus className="w-4 h-4" />
            Buat Kategori
          </button>
        </nav>

        <div className="my-6 border-t border-gray-100" />

        <p className="px-3 text-xs font-medium text-gray-400 mb-3">Favorit</p>
        {favoriteCategories.length === 0 ? (
          <p className="px-3 text-xs text-gray-400">
            Klik ikon bintang pada folder untuk menyematkannya di sini.
          </p>
        ) : (
          <div className="space-y-1">
            {favoriteCategories.map((category, index) => (
              <div
                key={category.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                  selectedFolderId === category.id
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => onSelectFolder(category.id)}
                  className="flex items-center gap-2.5 truncate flex-1 text-left"
                >
                  <span
                    className={`w-5 h-5 rounded-md shrink-0 ${favoriteColors[index % favoriteColors.length]}`}
                  />
                  <span className="truncate">{category.name}</span>
                </button>
                <button
                  onClick={() => onToggleFavorite(category.id)}
                  className="p-1 text-amber-400 hover:text-amber-500 transition"
                  title="Hapus dari Favorit"
                  aria-label="Hapus dari Favorit"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
      <div className="px-4 [&_button]:py-2 [&_button]:text-xs">
        <InstallAppButton />
      </div>
      <div className="p-3 m-4 mt-2 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 truncate" title={userEmail}>
            {userEmail}
          </p>
          <p className="text-[11px] text-gray-400">Pemilik</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title="Keluar"
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
