"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { navTypes, useApp } from "@/components/AppShell";
import PageHeader, { PageBody } from "@/components/PageHeader";
import FolderGrid from "@/components/FolderGrid";
import DocumentGrid from "@/components/DocumentGrid";

/** Halaman Favorit: folder yang disematkan dan dokumen di dalamnya. */
export default function FavoritesView() {
  const app = useApp();
  const favoriteCategories = app.categories.filter((category) => app.favorites.includes(category.id));
  const documents = app.documents
    .filter((doc) => doc.categoryIds.some((id) => app.favorites.includes(id)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <PageHeader
        title="Favorit"
        subtitle={
          favoriteCategories.length > 0
            ? `${favoriteCategories.length} folder disematkan · ${documents.length} dokumen`
            : "Folder yang Anda sematkan"
        }
      />

      <PageBody className="space-y-8 sm:space-y-10">
        {favoriteCategories.length === 0 ? (
          <div className="motion-rise bg-white border border-gray-200/80 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Belum ada favorit</p>
            <p className="text-xs text-gray-400 mt-1 mb-4 max-w-xs mx-auto">
              Ketuk ikon bintang pada folder di Beranda atau di halaman Kategori untuk menyematkannya di sini.
            </p>
            <Link
              href="/kategori"
              transitionTypes={navTypes("/favorit", "/kategori")}
              className="press inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
            >
              Lihat semua kategori
            </Link>
          </div>
        ) : (
          <>
            <FolderGrid
              title="Folder favorit"
              layout="grid"
              showAdd={false}
              categories={favoriteCategories}
              selectedFolderId=""
              favorites={app.favorites}
              onSelectFolder={app.openFolder}
              onToggleFavorite={app.toggleFavorite}
              onOpenCategoryModal={app.createCategory}
              themeFor={app.themeFor}
            />

            <DocumentGrid
              documents={documents}
              refreshing={app.isRefreshing}
              highlightId={app.highlightId}
              hasActiveFilter={false}
              onResetFilters={() => {}}
              onOpenUpload={app.openUpload}
              onPreview={app.previewDocument}
              onOpenInDrive={app.openInDrive}
              onEdit={app.editDocument}
              onDelete={app.deleteDocument}
              onShare={app.shareDocument}
            />
          </>
        )}
      </PageBody>
    </>
  );
}
