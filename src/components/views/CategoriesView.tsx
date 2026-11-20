"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  ChevronRight,
  FolderOpen,
  FolderPlus,
  Inbox,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import type { CategoryWithDocs } from "@/types";
import { formatBytes } from "@/lib/file-types";
import { UNCATEGORIZED, useApp } from "@/components/AppShell";
import PageHeader, { PageBody } from "@/components/PageHeader";
import Popover from "@/components/ui/Popover";

/** Halaman Kategori: daftar semua kategori, buat, ganti nama, dan hapus. */
export default function CategoriesView() {
  const app = useApp();
  const uncategorizedCount = app.documents.filter((doc) => doc.categoryIds.length === 0).length;

  const createButton = (
    <button
      type="button"
      onClick={app.createCategory}
      className="press shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Buat</span>
      <span className="hidden sm:inline">kategori</span>
    </button>
  );

  return (
    <>
      <PageHeader
        title="Kategori"
        subtitle={`${app.categories.length} kategori · ${app.documents.length} dokumen`}
        action={createButton}
      />

      <PageBody width="narrow">
        {app.categories.length === 0 ? (
          <button
            type="button"
            onClick={app.createCategory}
            className="motion-rise w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Buat kategori pertama</span>
            <span className="text-xs">Kategori membantu mengelompokkan dokumen tanpa menyalin file.</span>
          </button>
        ) : (
          <ul className="bg-white border border-gray-200/80 rounded-2xl divide-y divide-gray-100">
            {app.categories.map((category, index) => (
              <CategoryRow key={category.id} category={category} index={index} />
            ))}
          </ul>
        )}

        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => app.openFolder(UNCATEGORIZED)}
            className="motion-rise mt-4 w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-dashed border-gray-200 rounded-2xl text-left hover:bg-gray-50 transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4 text-gray-500" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-gray-900">Tanpa kategori</span>
              <span className="block text-xs text-gray-500">{uncategorizedCount} dokumen belum dikelompokkan</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </PageBody>
    </>
  );
}

function CategoryRow({ category, index }: { category: CategoryWithDocs; index: number }) {
  const app = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isFavorite = app.favorites.includes(category.id);
  const size = category.documents.reduce((sum, doc) => sum + doc.file_size, 0);

  const item = (label: string, Icon: typeof Pencil, action: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setMenuOpen(false);
        action();
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg text-left transition-colors focus:outline-none ${
        danger
          ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50"
          : "text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      {label}
    </button>
  );

  return (
    <li
      style={{ "--i": index } as CSSProperties}
      className="motion-rise flex items-center gap-1 pr-2 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50/70 transition-colors"
    >
      <button
        type="button"
        onClick={() => app.openFolder(category.id)}
        className="flex-1 min-w-0 flex items-center gap-3 pl-4 py-3.5 text-left"
      >
        <span className={`w-10 h-10 rounded-xl shrink-0 ${app.themeFor(category.id).swatch}`} />
        <span className="min-w-0">
          <span className="block font-mono text-sm font-semibold text-gray-900 truncate">{category.name}</span>
          <span className="block text-xs text-gray-500 truncate">
            {category.documents.length} dokumen
            {size > 0 && ` · ${formatBytes(size)}`}
            {category.description && ` · ${category.description}`}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => app.toggleFavorite(category.id)}
        aria-label={isFavorite ? "Hapus dari Favorit" : "Sematkan ke Favorit"}
        aria-pressed={isFavorite}
        className="press w-9 h-9 rounded-full flex items-center justify-center hover:bg-white shrink-0"
      >
        <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      </button>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Menu kategori ${category.name}`}
        className={`press w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
          menuOpen ? "border-gray-300 bg-white text-gray-900" : "border-transparent text-gray-500 hover:bg-white"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <Popover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={triggerRef}
        align="end"
        role="menu"
        ariaLabel={`Menu kategori ${category.name}`}
        className="w-52 sm:w-48 p-1"
      >
        {item("Buka folder", FolderOpen, () => app.openFolder(category.id))}
        {item("Ganti nama & deskripsi", Pencil, () => app.editCategory(category))}
        <div className="my-1 border-t border-gray-100" />
        {item("Hapus kategori", Trash2, () => app.deleteCategory(category), true)}
      </Popover>
    </li>
  );
}
