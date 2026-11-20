"use client";

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { CategoryWithDocs, DocumentItem, DocumentWithCategories } from "@/types";
import type { FileKind } from "@/lib/file-types";
import { FOLDER_THEMES, type FolderTheme } from "@/lib/folder-themes";
import { removeFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";
import { usePresence } from "@/lib/use-presence";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import DocumentViewer from "@/components/DocumentViewer";
import CategoryModal from "@/components/modals/CategoryModal";
import DeleteCategoryModal from "@/components/modals/DeleteCategoryModal";
import UploadModal from "@/components/modals/UploadModal";
import EditDocumentModal from "@/components/modals/EditDocumentModal";
import DeleteDocumentModal from "@/components/modals/DeleteDocumentModal";
import ShareModal from "@/components/modals/ShareModal";

/** Nilai filter folder khusus untuk dokumen yang tidak punya kategori. */
export const UNCATEGORIZED = "NONE";
export type FolderFilter = string; // "ALL" | UNCATEGORIZED | id kategori
export type KindFilter = "ALL" | FileKind;
export type SortKey = "newest" | "oldest" | "name" | "size";

/** Urutan tab: menentukan arah animasi geser antarhalaman. */
export const NAV_ORDER = ["/", "/favorit", "/kategori", "/akun"] as const;
export function navTypes(from: string, to: string): string[] {
  const a = NAV_ORDER.indexOf(from as (typeof NAV_ORDER)[number]);
  const b = NAV_ORDER.indexOf(to as (typeof NAV_ORDER)[number]);
  if (a === -1 || b === -1 || a === b) return [];
  return [b > a ? "nav-forward" : "nav-back"];
}

interface AppContextValue {
  userEmail: string;
  categories: CategoryWithDocs[];
  /** Semua dokumen unik, lengkap dengan daftar kategorinya. */
  documents: DocumentWithCategories[];
  favorites: string[];
  themeFor: (categoryId: string) => FolderTheme;
  isRefreshing: boolean;
  highlightId: string | null;

  // Filter Beranda (disimpan di sini agar bertahan saat pindah tab).
  folder: FolderFilter;
  setFolder: (id: FolderFilter) => void;
  kind: KindFilter;
  setKind: (value: KindFilter) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  search: string;
  setSearch: (value: string) => void;
  /** Buka folder di Beranda dari halaman mana pun. */
  openFolder: (id: FolderFilter) => void;

  // Aksi
  refresh: (documentId?: string) => void;
  showToast: (message: string) => void;
  toggleFavorite: (categoryId: string) => void;
  openUpload: () => void;
  createCategory: () => void;
  editCategory: (category: CategoryWithDocs) => void;
  deleteCategory: (category: CategoryWithDocs) => void;
  previewDocument: (document: DocumentWithCategories) => void;
  openInDrive: (fileKey: string) => void;
  editDocument: (document: DocumentWithCategories) => void;
  deleteDocument: (document: DocumentWithCategories) => void;
  shareDocument: (document: DocumentWithCategories) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp harus dipakai di dalam <AppShell>");
  return value;
}

/** State modal: `key` bertambah tiap dibuka agar form bersih; `open` terpisah untuk animasi keluar. */
type Sheet<T> = { item: T | null; open: boolean; key: number };
function useSheet<T>() {
  const [state, setState] = useState<Sheet<T>>({ item: null, open: false, key: 0 });
  const open = useCallback((item: T) => setState((s) => ({ item, open: true, key: s.key + 1 })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  return [state, open, close] as const;
}

interface AppShellProps {
  categories: CategoryWithDocs[];
  uncategorized: DocumentItem[];
  userEmail: string;
  children: React.ReactNode;
}

/**
 * Kerangka aplikasi bersama untuk semua halaman (Beranda, Favorit, Kategori,
 * Akun): data pustaka, navigasi, toast, dan seluruh modal. Halaman hanya
 * merender isinya dan memanggil aksi lewat useApp().
 */
export default function AppShell({ categories, uncategorized, userEmail, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, startRefresh] = useTransition();
  const favorites = useFavorites();

  // ---------- Filter Beranda ----------
  const [folderState, setFolderState] = useState<FolderFilter>("ALL");
  const [kind, setKindState] = useState<KindFilter>("ALL");
  const [sort, setSortState] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  // Dibungkus startTransition agar <ViewTransition> menganimasikan perubahan.
  const setFolder = useCallback((id: FolderFilter) => startTransition(() => setFolderState(id)), []);
  const setKind = useCallback((value: KindFilter) => startTransition(() => setKindState(value)), []);
  const setSort = useCallback((value: SortKey) => startTransition(() => setSortState(value)), []);

  // Kategori terpilih bisa hilang setelah dihapus/refresh.
  const folder =
    folderState === "ALL" || folderState === UNCATEGORIZED || categories.some((c) => c.id === folderState)
      ? folderState
      : "ALL";

  const openFolder = useCallback(
    (id: FolderFilter) => {
      setFolderState(id);
      setSearch("");
      if (pathname !== "/") router.push("/", { transitionTypes: navTypes(pathname, "/") });
    },
    [pathname, router]
  );

  // ---------- Data turunan ----------
  const documents = useMemo(() => {
    const map = new Map<string, DocumentWithCategories>();
    for (const category of categories) {
      for (const document of category.documents) {
        const existing = map.get(document.id);
        if (existing) {
          existing.categoryIds.push(category.id);
          existing.categoryNames.push(category.name);
        } else {
          map.set(document.id, { ...document, categoryIds: [category.id], categoryNames: [category.name] });
        }
      }
    }
    for (const document of uncategorized) {
      if (!map.has(document.id)) map.set(document.id, { ...document, categoryIds: [], categoryNames: [] });
    }
    return Array.from(map.values());
  }, [categories, uncategorized]);

  // Warna folder mengikuti urutan kategori, bukan posisi di daftar terfilter.
  const themeFor = useCallback(
    (categoryId: string) => {
      const index = categories.findIndex((category) => category.id === categoryId);
      return FOLDER_THEMES[Math.max(0, index) % FOLDER_THEMES.length];
    },
    [categories]
  );

  // ---------- Toast & sorotan ----------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastMounted = usePresence(toastVisible, 240);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000);
  }, []);

  /** Muat ulang data; opsional menyorot satu dokumen setelah selesai. */
  const refresh = useCallback(
    (documentId?: string) => {
      startRefresh(() => router.refresh());
      if (documentId) {
        setHighlightId(documentId);
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(() => setHighlightId(null), 3400);
      }
    },
    [router]
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  const openInDrive = useCallback(
    async (fileKey: string) => {
      // Buka tab lebih dulu agar tidak diblokir popup blocker (terutama di iOS).
      const tab = window.open("about:blank", "_blank");
      if (tab) tab.opener = null;
      try {
        const res = await fetch(`/api/preview?fileKey=${encodeURIComponent(fileKey)}`);
        const data = await res.json();
        if (data.success && data.url) {
          if (tab) tab.location.href = data.url;
          else window.location.href = data.url;
          return;
        }
        tab?.close();
        showToast(data.error ?? "Gagal membuka dokumen.");
      } catch {
        tab?.close();
        showToast("Gagal membuka dokumen.");
      }
    },
    [showToast]
  );

  // ---------- Modal ----------
  const [upload, openUploadSheet, closeUpload] = useSheet<true>();
  const [categorySheet, openCategorySheet, closeCategory] = useSheet<CategoryWithDocs | "new">();
  const [deletingCategory, openDeleteCategory, closeDeleteCategory] = useSheet<CategoryWithDocs>();
  const [viewing, openViewer, closeViewer] = useSheet<DocumentWithCategories>();
  const [editing, openEdit, closeEdit] = useSheet<DocumentWithCategories>();
  const [sharing, openShare, closeShare] = useSheet<DocumentWithCategories>();
  const [deleting, openDelete, closeDelete] = useSheet<DocumentWithCategories>();

  const openUpload = useCallback(() => openUploadSheet(true), [openUploadSheet]);
  const createCategory = useCallback(() => openCategorySheet("new"), [openCategorySheet]);

  const activeCategory = categories.find((category) => category.id === folder);

  const value: AppContextValue = {
    userEmail,
    categories,
    documents,
    favorites,
    themeFor,
    isRefreshing,
    highlightId,
    folder,
    setFolder,
    kind,
    setKind,
    sort,
    setSort,
    search,
    setSearch,
    openFolder,
    refresh,
    showToast,
    toggleFavorite,
    openUpload,
    createCategory,
    editCategory: openCategorySheet,
    deleteCategory: openDeleteCategory,
    previewDocument: openViewer,
    openInDrive,
    editDocument: openEdit,
    deleteDocument: openDelete,
    shareDocument: openShare,
  };

  const categoryToEdit = categorySheet.item === "new" ? null : categorySheet.item;

  return (
    <AppContext value={value}>
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex font-sans">
        {/* Progres tipis di atas saat data dimuat ulang. */}
        <div
          aria-hidden
          className={`fixed top-0 inset-x-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300 ${
            isRefreshing ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="progress-indeterminate h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </div>

        {toastMounted && toastMessage && (
          <div
            role="status"
            data-state={toastVisible ? "open" : "closed"}
            style={{ viewTransitionName: "toast", viewTransitionClass: "anchor" }}
            className="motion-toast fixed z-[70] left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:left-auto md:right-5 md:bottom-5 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">{children}</div>

        <MobileBottomNav />
      </div>

      <CategoryModal
        key={`category-${categorySheet.key}`}
        open={categorySheet.open}
        category={categoryToEdit}
        onClose={closeCategory}
        onSuccess={() => refresh()}
        showToast={showToast}
      />

      {deletingCategory.item && (
        <DeleteCategoryModal
          key={`delete-category-${deletingCategory.key}`}
          open={deletingCategory.open}
          category={deletingCategory.item}
          orphanCount={
            deletingCategory.item.documents.filter(
              (doc) => documents.find((d) => d.id === doc.id)?.categoryIds.length === 1
            ).length
          }
          onClose={closeDeleteCategory}
          onSuccess={(categoryId) => {
            removeFavorite(categoryId);
            refresh();
          }}
          showToast={showToast}
        />
      )}

      <UploadModal
        key={`upload-${upload.key}`}
        open={upload.open}
        onClose={closeUpload}
        categories={categories}
        // Di Beranda dengan folder terbuka, unggahan langsung masuk ke folder itu.
        defaultCategoryId={pathname === "/" ? (activeCategory?.id ?? "") : ""}
        onSuccess={refresh}
        showToast={showToast}
      />

      {viewing.item && (
        <DocumentViewer
          key={`view-${viewing.key}`}
          open={viewing.open}
          document={viewing.item}
          onClose={closeViewer}
          onOpenInDrive={openInDrive}
          onShare={openShare}
        />
      )}

      {editing.item && (
        <EditDocumentModal
          key={`edit-${editing.key}`}
          open={editing.open}
          document={editing.item}
          categories={categories}
          onClose={closeEdit}
          onSuccess={refresh}
          showToast={showToast}
        />
      )}

      {sharing.item && (
        <ShareModal
          key={`share-${sharing.key}`}
          open={sharing.open}
          document={sharing.item}
          onClose={closeShare}
          onChanged={() => refresh()}
          showToast={showToast}
        />
      )}

      {deleting.item && (
        <DeleteDocumentModal
          key={`delete-${deleting.key}`}
          open={deleting.open}
          document={deleting.item}
          onClose={closeDelete}
          onSuccess={() => refresh()}
          showToast={showToast}
        />
      )}
    </AppContext>
  );
}
