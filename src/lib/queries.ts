import { getSupabase } from "@/lib/supabase";
import type { CategoryWithDocs, DocumentItem, Library } from "@/types";

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
type RawLooseDocument = RawDocument & { document_categories: Array<{ category_id: string }> };

const docFields = (withSharing: boolean) =>
  withSharing ? `${DOC_FIELDS}, share_public, share_emails` : DOC_FIELDS;

const normalize = (document: RawDocument): DocumentItem => ({
  id: document.id,
  title: document.title,
  file_key: document.file_key,
  file_size: document.file_size,
  mime_type: document.mime_type,
  created_at: document.created_at,
  share_public: document.share_public ?? false,
  share_emails: document.share_emails ?? [],
});

async function selectCategories(withSharing: boolean) {
  return getSupabase()
    .from("categories")
    .select(`id, name, description, document_categories ( documents ( ${docFields(withSharing)} ) )`)
    .order("created_at", { ascending: false })
    .overrideTypes<RawCategory[], { merge: false }>();
}

async function selectAllDocuments(withSharing: boolean) {
  return getSupabase()
    .from("documents")
    .select(`${docFields(withSharing)}, document_categories ( category_id )`)
    .order("created_at", { ascending: false })
    .overrideTypes<RawLooseDocument[], { merge: false }>();
}

/** Jalankan query; jika kolom berbagi belum ada, ulangi tanpa kolom itu. */
async function withSharingFallback<T>(
  run: (withSharing: boolean) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>
): Promise<T> {
  let { data, error } = await run(true);
  if (error?.code === UNDEFINED_COLUMN) {
    console.warn(
      "Kolom berbagi belum ada. Jalankan supabase/migrations/20261119_sharing.sql di Supabase."
    );
    ({ data, error } = await run(false));
  }
  if (error) throw new Error(error.message);
  return data as T;
}

/**
 * Satu sumber kebenaran untuk membaca kategori beserta dokumennya.
 * Dipakai baik oleh Server Component maupun route handler API.
 */
export async function getCategoriesWithDocuments(): Promise<CategoryWithDocs[]> {
  const data = await withSharingFallback(selectCategories);
  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    documents: category.document_categories
      .map((relation) => relation.documents)
      .filter((document): document is RawDocument => document !== null)
      .map(normalize),
  }));
}

/** Dokumen yang tidak tertaut ke kategori mana pun. */
export async function getUncategorizedDocuments(): Promise<DocumentItem[]> {
  const data = await withSharingFallback(selectAllDocuments);
  return (data ?? [])
    .filter((document) => (document.document_categories ?? []).length === 0)
    .map(normalize);
}

/** Seluruh isi pustaka: kategori + dokumennya, dan dokumen tanpa kategori. */
export async function getLibrary(): Promise<Library> {
  const [categories, uncategorized] = await Promise.all([
    getCategoriesWithDocuments(),
    getUncategorizedDocuments(),
  ]);
  return { categories, uncategorized };
}
