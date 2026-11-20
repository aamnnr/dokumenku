"use client";

import { useDeferredValue, useMemo, ViewTransition } from "react";
import { FILE_KIND_LABELS } from "@/lib/file-types";
import { availableKinds, filterAndSort, SORT_OPTIONS, type KindFilter, type SortKey } from "@/lib/document-filters";
import { UNCATEGORIZED, useApp } from "@/components/AppShell";
import TopHeader from "@/components/TopHeader";
import FolderGrid from "@/components/FolderGrid";
import DocumentGrid from "@/components/DocumentGrid";
import FilterPill from "@/components/ui/FilterPill";
import { PageBody } from "@/components/PageHeader";

/** Beranda: pencarian, filter, folder, dan daftar dokumen. */
export default function HomeView() {
  const app = useApp();
  const { categories, documents, folder, kind, sort, search } = app;
  // Pencarian ditunda sedikit agar animasi daftar berjalan sebagai transition.
  const query = useDeferredValue(search).trim().toLowerCase();

  const kinds = useMemo(() => availableKinds(documents), [documents]);
  const hasUncategorized = documents.some((doc) => doc.categoryIds.length === 0);

  const displayedDocuments = filterAndSort(
    documents.filter((doc) =>
      folder === "ALL"
        ? true
        : folder === UNCATEGORIZED
          ? doc.categoryIds.length === 0
          : doc.categoryIds.includes(folder)
    ),
    { kind, query, sort }
  );

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
                ...kinds.map((value) => ({ value, label: FILE_KIND_LABELS[value] })),
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
