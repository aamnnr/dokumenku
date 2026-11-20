"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, Plus, Star } from "lucide-react";
import type { CategoryWithDocs } from "@/types";
import { getFileKind, type FileKind } from "@/lib/file-types";
import FileKindIcon, { FILE_KIND_STYLES } from "@/components/ui/FileKindIcon";
import type { FolderTheme } from "@/lib/folder-themes";

interface FolderGridProps {
  categories: CategoryWithDocs[];
  selectedFolderId: string;
  favorites: string[];
  onSelectFolder: (id: string | "ALL") => void;
  onToggleFavorite: (id: string) => void;
  onOpenCategoryModal: () => void;
  themeFor: (categoryId: string) => FolderTheme;
  /** Judul bagian (default "Folder"). */
  title?: string;
  /** Teks saat daftar kosong. */
  emptyLabel?: string;
  /** "scroll": geser horizontal di mobile (Beranda). "grid": selalu grid. */
  layout?: "scroll" | "grid";
  /** Tampilkan tombol "Tambah" di judul bagian. */
  showAdd?: boolean;
}

export default function FolderGrid({
  categories,
  selectedFolderId,
  favorites,
  onSelectFolder,
  onToggleFavorite,
  onOpenCategoryModal,
  themeFor,
  title = "Folder",
  emptyLabel = "Buat kategori pertama",
  layout = "scroll",
  showAdd = true,
}: FolderGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-gray-800">{title}</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {categories.length}
          </span>
        </div>
        {showAdd && categories.length > 0 && (
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
          <span className="text-xs font-medium">{emptyLabel}</span>
        </button>
      ) : (
        // Mobile: geser horizontal. Tablet ke atas: grid.
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
              : "-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-2 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          }
        >
          {categories.map((category) => (
            <FolderCard
              key={category.id}
              category={category}
              theme={themeFor(category.id)}
              fullWidth={layout === "grid"}
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
  fullWidth,
}: {
  category: CategoryWithDocs;
  theme: FolderTheme;
  fullWidth: boolean;
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
      data-open={isSelected || undefined}
      className={`group relative pt-3 cursor-pointer transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] ${fullWidth ? "w-full" : "snap-start shrink-0 w-[72%] sm:w-auto"} focus:outline-none [perspective:900px]`}
    >
      {/* Tab folder. Saat terbuka berganti ke warna bagian dalam folder. */}
      <div
        className={`absolute top-0 left-0 h-[22px] rounded-t-xl border-t border-l border-r ${theme.border} transition-[width,border-color,background-color] duration-300 ease-[var(--ease-out)] ${
          isSelected ? `w-28 ${theme.back}` : `w-24 group-hover:w-[6.5rem] ${theme.tab} z-10`
        }`}
      />
      {/* Dinding belakang folder (hanya terlihat saat terbuka). */}
      <div
        aria-hidden
        className={`absolute inset-x-0 bottom-0 top-3 rounded-2xl rounded-tl-none border ${theme.border} ${theme.back} transition-opacity duration-300 ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Lembar kertas yang menyembul dari dalam folder saat terbuka. */}
      <div aria-hidden className="absolute inset-x-0 top-3 h-20 pointer-events-none">
        <span
          className={`absolute left-4 right-8 top-0 h-full rounded-lg bg-white border border-gray-200/70 shadow-2xs transition-transform duration-500 ease-[var(--ease-out)] ${
            isSelected ? "-translate-y-3 -rotate-2" : "translate-y-4"
          }`}
        />
        <span
          className={`absolute left-8 right-4 top-0 h-full rounded-lg bg-white border border-gray-200/70 shadow-2xs transition-transform duration-500 delay-75 ease-[var(--ease-out)] ${
            isSelected ? "-translate-y-1.5 rotate-[2.5deg]" : "translate-y-4"
          }`}
        >
          <span className="absolute left-3 right-6 top-2.5 h-1 rounded-full bg-gray-100" />
          <span className="absolute left-3 right-10 top-5 h-1 rounded-full bg-gray-100" />
        </span>
      </div>
      {/* Sampul depan: miring ke depan saat folder terbuka. */}
      <div
        className={`relative p-4 sm:p-5 rounded-2xl rounded-tl-none bg-gradient-to-b ${theme.body} border ${borderColor} origin-bottom transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out)] ${
          isSelected
            ? "[transform:rotateX(-20deg)] shadow-[0_-6px_16px_-8px_rgba(17,24,39,0.25)] rounded-tl-2xl"
            : "ring-0 ring-transparent group-hover:shadow-sm"
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
            {isSelected ? (
              <FolderOpen className="w-3.5 h-3.5 text-gray-900" />
            ) : (
              <Folder className="w-3.5 h-3.5" />
            )}
            {category.documents.length} dokumen
          </span>
        </div>
      </div>
    </div>
  );
}
