"use client";

import { useState, type CSSProperties } from "react";
import { FolderPlus, Home, LogOut, Plus, Shield, Star, User } from "lucide-react";
import Link from "next/link";
import type { CategoryWithDocs } from "@/types";
import Modal from "@/components/ui/Modal";
import InstallAppButton from "@/components/InstallAppButton";

interface MobileBottomNavProps {
  selectedFolderId: string;
  onSelectFolder: (id: string | "ALL") => void;
  onOpenUpload: () => void;
  onOpenCategory: () => void;
  categories: CategoryWithDocs[];
  favorites: string[];
  favoriteColors: string[];
  userEmail: string;
}

type Sheet = "favorites" | "account" | null;

/** Navigasi bawah untuk layar kecil (pengganti sidebar). */
export default function MobileBottomNav({
  selectedFolderId,
  onSelectFolder,
  onOpenUpload,
  onOpenCategory,
  categories,
  favorites,
  favoriteColors,
  userEmail,
}: MobileBottomNavProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const favoriteCategories = categories.filter((category) => favorites.includes(category.id));
  const favoriteActive = favoriteCategories.some((category) => category.id === selectedFolderId);

  const tab = (label: string, Icon: typeof Home, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
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
        className={`absolute top-1 h-1 w-1 rounded-full bg-indigo-600 transition-all duration-200 ${active ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
      />
      {label}
    </button>
  );

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        style={{ viewTransitionName: "bottom-nav", viewTransitionClass: "anchor" }}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch h-16 px-2">
          {tab("Beranda", Home, selectedFolderId === "ALL" && sheet === null, () => {
            onSelectFolder("ALL");
            window.scrollTo({ top: 0, behavior: "smooth" });
          })}
          {tab("Favorit", Star, favoriteActive || sheet === "favorites", () => setSheet("favorites"))}

          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenUpload}
              aria-label="Unggah dokumen"
              className="press w-12 h-12 -mt-5 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-900/20 hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {tab("Kategori", FolderPlus, false, onOpenCategory)}
          {tab("Akun", User, sheet === "account", () => setSheet("account"))}
        </div>
      </nav>

      <Modal open={sheet === "favorites"} title="Favorit" onClose={() => setSheet(null)}>
          {favoriteCategories.length === 0 ? (
            <p className="text-sm text-gray-500 pb-2">
              Belum ada favorit. Ketuk ikon bintang pada folder untuk menyematkannya di sini.
            </p>
          ) : (
            <div className="space-y-1 -mx-2">
              {favoriteCategories.map((category, index) => (
                <button
                  key={category.id}
                  style={{ "--i": index } as CSSProperties}
                  onClick={() => {
                    onSelectFolder(category.id);
                    setSheet(null);
                  }}
                  className={`motion-rise w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-colors ${
                    selectedFolderId === category.id ? "bg-gray-100 font-medium" : "active:bg-gray-50"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg shrink-0 ${favoriteColors[index % favoriteColors.length]}`} />
                  <span className="flex-1 truncate">{category.name}</span>
                  <span className="text-xs text-gray-400">{category.documents.length}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>

      <Modal open={sheet === "account"} title="Akun" onClose={() => setSheet(null)}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
              <p className="text-xs text-gray-400">Pemilik</p>
            </div>
          </div>
          <div className="pt-2 -mx-2">
            <InstallAppButton />
            <Link
              href="/privacy"
              transitionTypes={["nav-forward"]}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 active:bg-gray-50"
            >
              <Shield className="w-4 h-4 text-gray-400" />
              Kebijakan Privasi
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-600 active:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </form>
          </div>
        </Modal>
    </>
  );
}
