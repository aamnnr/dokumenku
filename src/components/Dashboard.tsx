"use client";

import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  ViewTransition,
} from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { CategoryWithDocs, DocumentWithCategories } from "@/types";
import { FAVORITES_STORAGE_KEY } from "@/lib/constants";
import { usePresence } from "@/lib/use-presence";
import { FILE_KIND_LABELS, getFileKind, type FileKind } from "@/lib/file-types";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import FolderGrid, { type FolderTheme } from "@/components/FolderGrid";
import DocumentGrid from "@/components/DocumentGrid";
import FilterPill from "@/components/ui/FilterPill";
import CategoryModal from "@/components/modals/CategoryModal";
import UploadModal from "@/components/modals/UploadModal";
import EditDocumentModal from "@/components/modals/EditDocumentModal";
import DeleteDocumentModal from "@/components/modals/DeleteDocumentModal";
import ShareModal from "@/components/modals/ShareModal";

const FOLDER_THEMES: FolderTheme[] = [
  { tab: "bg-[#E4E3FA]", body: "from-[#E4E3FA] to-[#F3F2FE]", border: "border-[#DDDCF6]" },
  { tab: "bg-[#DAEBFB]", body: "from-[#DAEBFB] to-[#F0F7FF]", border: "border-[#D3E6F8]" },
  { tab: "bg-[#FCE3D6]", body: "from-[#FCE3D6] to-[#FFF4EE]", border: "border-[#F7DCCD]" },
  { tab: "bg-[#D7F3E6]", body: "from-[#D7F3E6] to-[#EFFBF5]", border: "border-[#CDEDDD]" },
];

const FAVORITE_COLORS = [
  "bg-gradient-to-br from-[#C9C7F5] to-[#E4E3FA]",
  "bg-gradient-to-br from-[#B9DAF7] to-[#DAEBFB]",
  "bg-gradient-to-br from-[#F7C9B2] to-[#FCE3D6]",
  "bg-gradient-to-br from-[#B5E6CF] to-[#D7F3E6]",
];

type KindFilter = "ALL" | FileKind;
type SortKey = "newest" | "oldest" | "name" | "size";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "name", label: "Nama (A–Z)" },
  { value: "size", label: "Ukuran terbesar" },
];

// ---------- Favorit (localStorage, aman untuk hidrasi) ----------
const EMPTY_FAVORITES: string[] = [];

function readStoredFavorites(): string[] {
  if (typeof window === "undefined") return EMPTY_FAVORITES;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : EMPTY_FAVORITES;
  } catch {
    return EMPTY_FAVORITES;
  }
}

let favoritesSnapshot: string[] =
  typeof window === "undefined" ? EMPTY_FAVORITES : readStoredFavorites();
const favoritesListeners = new Set<() => void>();

function subscribeFavorites(listener: () => void) {
  favoritesListeners.add(listener);
  return () => {
    favoritesListeners.delete(listener);
  };
}
const getFavoritesSnapshot = () => favoritesSnapshot;
const getFavoritesServerSnapshot = () => EMPTY_FAVORITES;

function updateFavorites(next: string[]) {
  favoritesSnapshot = next;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage tidak tersedia: favorit hanya berlaku di sesi ini.
  }
  favoritesListeners.forEach((listener) => listener());
}

// ---------- Komponen ----------
interface DashboardProps {
  categories: CategoryWithDocs[];
  userEmail: string;
}

export default function Dashboard({ categories, userEmail }: DashboardProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  // Pencarian ditunda sedikit agar animasi daftar berjalan sebagai transition.
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedFolderId, setFolderState] = useState<string | "ALL">("ALL");
  const [kindFilter, setKindState] = useState<KindFilter>("ALL");
  const [sortKey, setSortState] = useState<SortKey>("newest");

  // Dibungkus startTransition agar <ViewTransition> menganimasikan perubahan.
  const setSelectedFolderId = useCallback((id: string | "ALL") => {
    startTransition(() => setFolderState(id));
  }, []);
  const setKindFilter = useCallback((value: KindFilter) => {
    startTransition(() => setKindState(value));
  }, []);
  const setSortKey = useCallback((value: SortKey) => {
    startTransition(() => setSortState(value));
  }, []);
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot
  );

  // `key` bertambah setiap modal dibuka agar isi form selalu bersih,
  // sementara `open` dipisah supaya animasi keluar sempat diputar.
  const [upload, setUpload] = useState({ open: false, key: 0 });
  const [category, setCategory] = useState({ open: false, key: 0 });
  const [editing, setEditing] = useState<{ doc: DocumentWithCategories | null; open: boolean }>({
    doc: null,
    open: false,
  });
  const [deleting, setDeleting] = useState<{ doc: DocumentWithCategories | null; open: boolean }>({
    doc: null,
    open: false,
  });
  const openUpload = useCallback(() => setUpload((s) => ({ open: true, key: s.key + 1 })), []);
  const openCategory = useCallback(() => setCategory((s) => ({ open: true, key: s.key + 1 })), []);
  const closeUpload = useCallback(() => setUpload((s) => ({ ...s, open: false })), []);
  const closeCategory = useCallback(() => setCategory((s) => ({ ...s, open: false })), []);
  const closeEditing = useCallback(() => setEditing((s) => ({ ...s, open: false })), []);
  const closeDeleting = useCallback(() => setDeleting((s) => ({ ...s, open: false })), []);
  const [sharing, setSharing] = useState<{ doc: DocumentWithCategories | null; open: boolean }>({
    doc: null,
    open: false,
  });
  const closeSharing = useCallback(() => setSharing((s) => ({ ...s, open: false })), []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastMounted = usePresence(toastVisible, 240);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kategori yang dipilih bisa hilang setelah refresh data.
  const activeFolderId =
    selectedFolderId === "ALL" || categories.some((c) => c.id === selectedFolderId)
      ? selectedFolderId
      : "ALL";

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

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  const toggleFavorite = useCallback((categoryId: string) => {
    updateFavorites(
      favoritesSnapshot.includes(categoryId)
        ? favoritesSnapshot.filter((id) => id !== categoryId)
        : [...favoritesSnapshot, categoryId]
    );
  }, []);

  const handlePreview = async (fileKey: string) => {
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
  };

  // Semua dokumen unik (satu dokumen bisa di banyak kategori).
  const allDocuments = useMemo(() => {
    const map = new Map<string, DocumentWithCategories>();
    for (const category of categories) {
      for (const document of category.documents) {
        const existing = map.get(document.id);
        if (existing) {
          existing.categoryIds.push(category.id);
          existing.categoryNames.push(category.name);
        } else {
          map.set(document.id, {
            ...document,
            categoryIds: [category.id],
            categoryNames: [category.name],
          });
        }
      }
    }
    return Array.from(map.values());
  }, [categories]);

  const availableKinds = useMemo(
    () => [...new Set(allDocuments.map((doc) => getFileKind(doc.mime_type, doc.title)))],
    [allDocuments]
  );

  const query = deferredQuery.trim().toLowerCase();
  const displayedDocuments = allDocuments
    .filter((doc) => activeFolderId === "ALL" || doc.categoryIds.includes(activeFolderId))
    .filter((doc) => kindFilter === "ALL" || getFileKind(doc.mime_type, doc.title) === kindFilter)
    .filter(
      (doc) =>
        !query ||
        doc.title.toLowerCase().includes(query) ||
        doc.categoryNames.some((name) => name.toLowerCase().includes(query))
    )
    .sort((a, b) => {
      switch (sortKey) {
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

  const activeCategory = categories.find((category) => category.id === activeFolderId);
  const hasActiveFilter = activeFolderId !== "ALL" || kindFilter !== "ALL" || Boolean(query);

  const resetFilters = () => {
    startTransition(() => {
      setFolderState("ALL");
      setKindState("ALL");
    });
    setSearchQuery("");
  };

  return (
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

      <Sidebar
        selectedFolderId={activeFolderId}
        onSelectFolder={setSelectedFolderId}
        onOpenUpload={openUpload}
        onOpenCategory={openCategory}
        categories={categories}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        favoriteColors={FAVORITE_COLORS}
        userEmail={userEmail}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCategoryModal={openCategory}
          onOpenUploadModal={openUpload}
        />

        <main className="flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-8 sm:pt-8 md:pb-10 max-w-7xl w-full mx-auto space-y-8 sm:space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <ViewTransition key={activeFolderId} enter="title-swap" exit="title-swap" default="none">
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-gray-900 truncate">
                {activeCategory ? activeCategory.name : "Dokumen Saya"}
              </h1>
            </ViewTransition>

            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterPill
                label="Kategori"
                value={activeFolderId}
                onChange={setSelectedFolderId}
                options={[
                  { value: "ALL", label: "Semua" },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
              <FilterPill<KindFilter>
                label="Jenis"
                value={kindFilter}
                onChange={setKindFilter}
                options={[
                  { value: "ALL", label: "Semua" },
                  ...availableKinds.map((kind) => ({ value: kind, label: FILE_KIND_LABELS[kind] })),
                ]}
              />
              <FilterPill<SortKey>
                label="Urutkan"
                value={sortKey}
                onChange={setSortKey}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          <FolderGrid
            categories={filteredCategories}
            selectedFolderId={activeFolderId}
            favorites={favorites}
            onSelectFolder={setSelectedFolderId}
            onToggleFavorite={toggleFavorite}
            onOpenCategoryModal={openCategory}
            folderThemes={FOLDER_THEMES}
          />

          <DocumentGrid
            documents={displayedDocuments}
            refreshing={isRefreshing}
            highlightId={highlightId}
            hasActiveFilter={hasActiveFilter}
            onResetFilters={resetFilters}
            onOpenUpload={openUpload}
            onPreview={handlePreview}
            onEdit={(doc) => setEditing({ doc, open: true })}
            onDelete={(doc) => setDeleting({ doc, open: true })}
            onShare={(doc) => setSharing({ doc, open: true })}
          />
        </main>
      </div>

      <MobileBottomNav
        selectedFolderId={activeFolderId}
        onSelectFolder={setSelectedFolderId}
        onOpenUpload={openUpload}
        onOpenCategory={openCategory}
        categories={categories}
        favorites={favorites}
        favoriteColors={FAVORITE_COLORS}
        userEmail={userEmail}
      />

      <CategoryModal
        key={`category-${category.key}`}
        open={category.open}
        onClose={closeCategory}
        onSuccess={() => refresh()}
        showToast={showToast}
      />

      <UploadModal
        key={`upload-${upload.key}`}
        open={upload.open}
        onClose={closeUpload}
        categories={categories}
        defaultCategoryId={activeCategory?.id ?? categories[0]?.id ?? ""}
        onSuccess={refresh}
        showToast={showToast}
      />

      {editing.doc && (
        <EditDocumentModal
          key={`edit-${editing.doc.id}`}
          open={editing.open}
          document={editing.doc}
          categories={categories}
          onClose={closeEditing}
          onSuccess={refresh}
          showToast={showToast}
        />
      )}

      {sharing.doc && (
        <ShareModal
          key={`share-${sharing.doc.id}`}
          open={sharing.open}
          document={sharing.doc}
          onClose={closeSharing}
          onChanged={() => refresh()}
          showToast={showToast}
        />
      )}

      {deleting.doc && (
        <DeleteDocumentModal
          key={`delete-${deleting.doc.id}`}
          open={deleting.open}
          document={deleting.doc}
          onClose={closeDeleting}
          onSuccess={() => refresh()}
          showToast={showToast}
        />
      )}
    </div>
  );
}
