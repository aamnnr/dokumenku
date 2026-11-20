"use client";

import { useDeferredValue, useMemo, ViewTransition } from "react";
import { FILE_KIND_LABELS, getFileKind } from "@/lib/file-types";
import { UNCATEGORIZED, useApp, type KindFilter, type SortKey } from "@/components/AppShell";
import TopHeader from "@/components/TopHeader";
import FolderGrid from "@/components/FolderGrid";
import DocumentGrid from "@/components/DocumentGrid";
import FilterPill from "@/components/ui/FilterPill";
import { PageBody } from "@/components/PageHeader";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "name", label: "Nama (A–Z)" },
  { value: "size", label: "Ukuran terbesar" },
];

/** Beranda: pencarian, filter, folder, dan daftar dokumen. */
export default function HomeView() {
  const app = useApp();
  const { categories, documents, folder, kind, sort, search } = app;
  // Pencarian ditunda sedikit agar animasi daftar berjalan sebagai transition.
  const query = useDeferredValue(search).trim().toLowerCase();

  const availableKinds = useMemo(
    () => [...new Set(documents.map((doc) => getFileKind(doc.mime_type, doc.title)))],
    [documents]
  );
  const hasUncategorized = documents.some((doc) => doc.categoryIds.length === 0);

  const displayedDocuments = documents
    .filter((doc) =>
      folder === "ALL"
        ? true
        : folder === UNCATEGORIZED
          ? doc.categoryIds.length === 0
          : doc.categoryIds.includes(folder)
    )
    .filter((doc) => kind === "ALL" || getFileKind(doc.mime_type, doc.title) === kind)
    .filter(
      (doc) =>
        !query ||
        doc.title.toLowerCase().includes(query) ||
        doc.categoryNames.some((name) => name.toLowerCase().includes(query))
    )
    .sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "name":
          return a.title.localeCompare(b.title, "id");
        case "size":
          return b.file_size - a.file_size;
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });

  const filteredCategories = categories.filter(
    (category) =>
      !query ||
      category.name.toLowerCase().includes(query) ||
      (category.description ?? "").toLowerCase().includes(query)
  );

  const activeCategory = categories.find((category) => category.id === folder);
  const hasActiveFilter = folder !== "ALL" || kind !== "ALL" || Boolean(query);

  const resetFilters = () => {
    app.setFolder("ALL");
    app.setKind("ALL");
    app.setSearch("");
  };

  return (
    <>
      <TopHeader
        searchQuery={search}
        onSearchChange={app.setSearch}
        onOpenCategoryModal={app.createCategory}
        onOpenUploadModal={app.openUpload}
      />

      <PageBody className="space-y-8 sm:space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <ViewTransition key={folder} enter="title-swap" exit="title-swap" default="none">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-gray-900 truncate">
              {activeCategory ? activeCategory.name : folder === UNCATEGORIZED ? "Tanpa Kategori" : "Dokumen Saya"}
            </h1>
          </ViewTransition>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterPill
              label="Kategori"
              value={folder}
              onChange={app.setFolder}
              options={[
                { value: "ALL", label: "Semua" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
                ...(hasUncategorized ? [{ value: UNCATEGORIZED, label: "Tanpa kategori" }] : []),
              ]}
            />
            <FilterPill<KindFilter>
              label="Jenis"
              value={kind}
              onChange={app.setKind}
              options={[
                { value: "ALL", label: "Semua" },
                ...availableKinds.map((value) => ({ value, label: FILE_KIND_LABELS[value] })),
              ]}
            />
            <FilterPill<SortKey> label="Urutkan" value={sort} onChange={app.setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <FolderGrid
          categories={filteredCategories}
          selectedFolderId={folder}
          favorites={app.favorites}
          onSelectFolder={app.setFolder}
          onToggleFavorite={app.toggleFavorite}
          onOpenCategoryModal={app.createCategory}
          themeFor={app.themeFor}
        />

        <DocumentGrid
          documents={displayedDocuments}
          refreshing={app.isRefreshing}
          highlightId={app.highlightId}
          hasActiveFilter={hasActiveFilter}
          onResetFilters={resetFilters}
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
