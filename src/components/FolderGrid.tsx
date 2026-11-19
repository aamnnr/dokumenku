"use client";

import React, { useState } from "react";
import { Plus, Star } from "lucide-react";
import type { CategoryWithDocs } from "@/types";
import { getFileKind, type FileKind } from "@/lib/file-types";
import FileKindIcon, { FILE_KIND_STYLES } from "@/components/ui/FileKindIcon";

export interface FolderTheme {
  /** Gradien badan kartu, dimulai dari warna tab agar menyatu. */
  body: string;
  tab: string;
  border: string;
}

interface FolderGridProps {
  categories: CategoryWithDocs[];
  selectedFolderId: string;
  favorites: string[];
  onSelectFolder: (id: string | "ALL") => void;
  onToggleFavorite: (id: string) => void;
  onOpenCategoryModal: () => void;
  folderThemes: FolderTheme[];
}

export default function FolderGrid({
  categories,
  selectedFolderId,
  favorites,
  onSelectFolder,
  onToggleFavorite,
  onOpenCategoryModal,
  folderThemes,
}: FolderGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-gray-800">Folder</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {categories.length}
          </span>
        </div>
        {categories.length > 0 && (
          <button
            onClick={onOpenCategoryModal}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <button
          onClick={onOpenCategoryModal}
          className="motion-rise w-full sm:w-72 h-36 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">Buat kategori pertama</span>
        </button>
      ) : (
        // Mobile: geser horizontal. Tablet ke atas: grid.
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-2 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category, index) => (
            <FolderCard
              key={category.id}
              category={category}
              theme={folderThemes[index % folderThemes.length]}
              isSelected={selectedFolderId === category.id}
              isFavorite={favorites.includes(category.id)}
              onSelect={() => onSelectFolder(selectedFolderId === category.id ? "ALL" : category.id)}
              onToggleFavorite={() => onToggleFavorite(category.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FolderCard({
  category,
  theme,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  category: CategoryWithDocs;
  theme: FolderTheme;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  // Kunci animasi bintang: hanya diputar saat pengguna menekan, bukan saat muat.
  const [starPop, setStarPop] = useState(0);
  // Jenis file unik di folder ini, maksimal 3 ikon.
  const kinds = [
    ...new Set(category.documents.map((doc) => getFileKind(doc.mime_type, doc.title))),
  ].slice(0, 3) as FileKind[];
  const borderColor = isSelected ? "border-gray-900" : theme.border;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isSelected}
      className="group relative pt-3 cursor-pointer transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] snap-start shrink-0 w-[72%] sm:w-auto focus:outline-none"
    >
      {/* Tab folder: warna sama dengan bagian atas kartu, menutupi garis tepi atas. */}
      <div
        className={`absolute top-0 left-0 z-10 h-[22px] rounded-t-xl ${theme.tab} border-t border-l border-r ${borderColor} transition-[width,border-color] duration-300 ease-[var(--ease-out)] ${
          isSelected ? "w-28" : "w-24 group-hover:w-[6.5rem]"
        }`}
      />
      <div
        className={`relative p-4 sm:p-5 rounded-2xl rounded-tl-none bg-gradient-to-b ${theme.body} border ${borderColor} transition-[box-shadow,border-color] duration-300 ${
          isSelected ? "ring-4 ring-gray-900/10 shadow-md" : "ring-0 ring-transparent group-hover:shadow-sm"
        } group-focus-visible:ring-2 group-focus-visible:ring-gray-900/20 flex flex-col justify-between h-36`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-medium text-gray-500 truncate pt-1">
            {category.description || "Kumpulan berkas"}
          </span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setStarPop((value) => value + 1);
              onToggleFavorite();
            }}
            title={isFavorite ? "Hapus dari Favorit" : "Sematkan ke Favorit"}
            aria-label={isFavorite ? "Hapus dari Favorit" : "Sematkan ke Favorit"}
            className="press w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-2xs shrink-0"
          >
            <Star
              key={starPop}
              className={`w-3.5 h-3.5 transition-colors duration-200 ${starPop > 0 ? "motion-star" : ""} ${
                isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        <h3 className="font-mono text-base font-semibold text-gray-900 truncate my-1">
          {category.name}
        </h3>

        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-1.5">
            {kinds.length === 0 ? (
              <span className="text-[11px] text-gray-400">Kosong</span>
            ) : (
              kinds.map((kind) => (
                <span
                  key={kind}
                  className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 ${FILE_KIND_STYLES[kind].chip}`}
                >
                  <FileKindIcon kind={kind} className="w-3 h-3" />
                </span>
              ))
            )}
          </div>
          <span className="text-xs font-medium text-gray-500">
            {category.documents.length} dokumen
          </span>
        </div>
      </div>
    </div>
  );
}
