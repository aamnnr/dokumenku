import { getSupabase } from "@/lib/supabase";
import type { CategoryWithDocs, DocumentItem } from "@/types";

/** Kode Postgres untuk kolom yang belum ada (migrasi belum dijalankan). */
export const UNDEFINED_COLUMN = "42703";

const DOC_FIELDS = "id, title, file_key, file_size, mime_type, created_at";

type RawDocument = Omit<DocumentItem, "share_public" | "share_emails"> &
  Partial<Pick<DocumentItem, "share_public" | "share_emails">>;
type RawCategory = {
  id: string;
  name: string;
  description: string | null;
  document_categories: Array<{ documents: RawDocument | null }>;
};

async function selectCategories(withSharing: boolean) {
  const fields = withSharing ? `${DOC_FIELDS}, share_public, share_emails` : DOC_FIELDS;
  return getSupabase()
    .from("categories")
    .select(`id, name, description, document_categories ( documents ( ${fields} ) )`)
    .order("created_at", { ascending: false })
    .overrideTypes<RawCategory[], { merge: false }>();
}

/**
 * Satu sumber kebenaran untuk membaca kategori beserta dokumennya.
 * Dipakai baik oleh Server Component maupun route handler API.
 */
export async function getCategoriesWithDocuments(): Promise<CategoryWithDocs[]> {
  let { data, error } = await selectCategories(true);

  // Kolom berbagi belum dibuat: tetap tampilkan data tanpa status berbagi.
  if (error?.code === UNDEFINED_COLUMN) {
    console.warn(
      "Kolom berbagi belum ada. Jalankan supabase/migrations/20261119_sharing.sql di Supabase."
    );
    ({ data, error } = await selectCategories(false));
  }
  if (error) throw new Error(error.message);

  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    documents: category.document_categories
      .map((relation) => relation.documents)
      .filter((document): document is RawDocument => document !== null)
      .map((document) => ({
        ...document,
        share_public: document.share_public ?? false,
        share_emails: document.share_emails ?? [],
      })),
  }));
}
