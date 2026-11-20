import type { DocumentWithCategories } from "@/types";
import { getFileKind, type FileKind } from "@/lib/file-types";

export type KindFilter = "ALL" | FileKind;
export type SortKey = "newest" | "oldest" | "name" | "size";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "name", label: "Nama (A–Z)" },
  { value: "size", label: "Ukuran terbesar" },
];

/** Jenis file yang benar-benar ada di daftar (untuk pilihan filter Jenis). */
export function availableKinds(documents: DocumentWithCategories[]): FileKind[] {
  return [...new Set(documents.map((doc) => getFileKind(doc.mime_type, doc.title)))];
}

/** Saring berdasarkan jenis & kata kunci lalu urutkan. Dipakai Beranda dan halaman folder. */
export function filterAndSort(
  documents: DocumentWithCategories[],
  { kind, query, sort }: { kind: KindFilter; query: string; sort: SortKey }
): DocumentWithCategories[] {
  const q = query.trim().toLowerCase();
  return documents
    .filter((doc) => kind === "ALL" || getFileKind(doc.mime_type, doc.title) === kind)
    .filter(
      (doc) =>
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.categoryNames.some((name) => name.toLowerCase().includes(q))
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
}
