import type { Database } from "@/types/database";

export interface DocumentItem {
  id: string;
  title: string;
  file_key: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  share_public: boolean;
  share_emails: string[];
}

export interface DocumentWithCategories extends DocumentItem {
  categoryIds: string[];
  categoryNames: string[];
}

export interface CategoryWithDocs {
  id: string;
  name: string;
  description: string | null;
  documents: DocumentItem[];
}

/** Isi pustaka: kategori beserta dokumennya + dokumen tanpa kategori. */
export interface Library {
  categories: CategoryWithDocs[];
  uncategorized: DocumentItem[];
}

export interface DocumentsResponse extends Partial<Library> {
  success: boolean;
  error?: string;
}

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
