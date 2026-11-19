/**
 * Representasi skema Supabase yang dipakai aplikasi.
 * Selaras dengan file `supabase/schema.sql`.
 */
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          title: string;
          file_key: string;
          file_size: number;
          mime_type: string;
          /** MD5 dari konten file, dipakai untuk deduplikasi (bukan untuk keamanan). */
          file_hash: string;
          /** Tautan publik ("siapa saja yang punya link") aktif di Drive. */
          share_public: boolean;
          /** Email yang diberi akses lihat di Drive. */
          share_emails: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_key: string;
          file_size: number;
          mime_type: string;
          file_hash: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          file_key?: string;
          file_size?: number;
          mime_type?: string;
          file_hash?: string;
          share_public?: boolean;
          share_emails?: string[];
        };
        Relationships: [];
      };
      document_categories: {
        Row: {
          document_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          document_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          category_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_categories_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
