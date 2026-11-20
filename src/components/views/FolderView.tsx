"use client";

import { useDeferredValue, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FolderX, Inbox, MoreHorizontal, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { formatBytes, FILE_KIND_LABELS } from "@/lib/file-types";
import { availableKinds, filterAndSort, SORT_OPTIONS, type KindFilter, type SortKey } from "@/lib/document-filters";
import { navTypes, UNCATEGORIZED, UNCATEGORIZED_SLUG, useApp } from "@/components/AppShell";
import PageHeader, { PageBody } from "@/components/PageHeader";
import DocumentGrid from "@/components/DocumentGrid";
import FilterPill from "@/components/ui/FilterPill";
import Popover from "@/components/ui/Popover";

/**
 * Halaman satu folder: /kategori/[id] (atau /kategori/tanpa-kategori).
 * Dibuka dari Kategori, Favorit (?dari=favorit), atau sidebar.
 */
export default function FolderView() {
  const app = useApp();
  const { id } = useParams<{ id: string }>();
  const fromFavorites = useSearchParams().get("dari") === "favorit";
  const backHref = fromFavorites ? "/favorit" : "/kategori";

  const isUncategorized = id === UNCATEGORIZED_SLUG;
  const category = isUncategorized ? null : app.categories.find((item) => item.id === id);

  // Filter khusus folder ini (tidak memengaruhi Beranda).
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);

  const backButton = (
    <button
      type="button"
      onClick={() => app.goBack(backHref)}
      aria-label={fromFavorites ? "Kembali ke Favorit" : "Kembali ke Kategori"}
      className="press -ml-2 w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 shrink-0"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );

  // Kategori sudah dihapus atau alamat salah.
  if (!isUncategorized && !category) {
    return (
      <>
        <PageHeader title="Folder tidak ditemukan" leading={backButton} />
        <PageBody width="narrow">
          <div className="motion-rise bg-white border border-gray-200/80 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FolderX className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Kategori ini sudah tidak ada</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Mungkin sudah dihapus. Dokumennya tetap tersimpan.</p>
            <Link
              href="/kategori"
              transitionTypes={navTypes(`/kategori/${id}`, "/kategori")}
              className="press inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
            >
              Lihat semua kategori
            </Link>
          </div>
        </PageBody>
      </>
    );
  }

  const folderDocuments = app.documents.filter((doc) =>
    category ? doc.categoryIds.includes(category.id) : doc.categoryIds.length === 0
  );
  const displayed = filterAndSort(folderDocuments, { kind, query, sort });
  const totalSize = folderDocuments.reduce((sum, doc) => sum + doc.file_size, 0);
  const hasActiveFilter = kind !== "ALL" || Boolean(query.trim());

  const subtitle = [
    `${folderDocuments.length} dokumen`,
    totalSize > 0 ? formatBytes(totalSize) : null,
    category?.description || (isUncategorized ? "Belum dikelompokkan" : null),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title={category ? category.name : "Tanpa kategori"}
        titleClassName={category ? "font-mono" : ""}
        subtitle={subtitle}
        leading={
          <>
            {backButton}
            {category ? (
              <span className={`w-9 h-9 rounded-xl shrink-0 ${app.themeFor(category.id).swatch}`} />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Inbox className="w-4 h-4 text-gray-500" />
              </span>
            )}
          </>
        }
        action={<FolderActions categoryId={category?.id ?? UNCATEGORIZED} />}
      />

      <PageBody className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Cari di folder ini…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
            />
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterPill<KindFilter>
              label="Jenis"
              value={kind}
              onChange={setKind}
              options={[
                { value: "ALL", label: "Semua" },
                ...availableKinds(folderDocuments).map((value) => ({ value, label: FILE_KIND_LABELS[value] })),
              ]}
            />
            <FilterPill<SortKey> label="Urutkan" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <DocumentGrid
          documents={displayed}
          refreshing={app.isRefreshing}
          highlightId={app.highlightId}
          hasActiveFilter={hasActiveFilter}
          onResetFilters={() => {
            setKind("ALL");
            setSearch("");
          }}
          onOpenUpload={app.openUpload}
          onPreview={app.previewDocument}
          onOpenInDrive={app.openInDrive}
          onEdit={app.editDocument}
          onDelete={app.deleteDocument}
          onShare={app.shareDocument}
        />
      </PageBody>
    </>
  );
}

/** Tombol di header: unggah ke folder ini, favorit, dan menu kategori. */
function FolderActions({ categoryId }: { categoryId: string }) {
  const app = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const category = app.categories.find((item) => item.id === categoryId);
  const isFavorite = category ? app.favorites.includes(category.id) : false;

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
    <div className="flex items-center gap-1 shrink-0">
      {category && (
        <button
          type="button"
          onClick={() => app.toggleFavorite(category.id)}
          aria-label={isFavorite ? "Hapus dari Favorit" : "Sematkan ke Favorit"}
          aria-pressed={isFavorite}
          className="press w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
        </button>
      )}

      {category && (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Menu kategori ${category.name}`}
            className={`press w-9 h-9 rounded-full flex items-center justify-center border ${
              menuOpen ? "border-gray-300 bg-white text-gray-900" : "border-transparent text-gray-500 hover:bg-gray-100"
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
            {item("Ganti nama & deskripsi", Pencil, () => app.editCategory(category))}
            <div className="my-1 border-t border-gray-100" />
            {item("Hapus kategori", Trash2, () => app.deleteCategory(category), true)}
          </Popover>
        </>
      )}

      <button
        type="button"
        onClick={app.openUpload}
        className="press ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Unggah</span>
        <span className="hidden sm:inline">ke sini</span>
      </button>
    </div>
  );
}
