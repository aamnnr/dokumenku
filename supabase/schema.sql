-- ============================================================
-- Dokumenku — skema Supabase
-- Jalankan di Supabase Dashboard > SQL Editor, lalu Apply.
-- ============================================================

create extension if not exists pgcrypto;

-- Kategori/folder dokumen
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Satu baris = satu file fisik di Google Drive.
-- file_hash (MD5 konten) unik => satu file hanya disimpan sekali.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_key text not null, -- Google Drive fileId
  file_size bigint not null default 0,
  mime_type text not null,
  file_hash text not null unique,
  created_at timestamptz not null default now()
);

-- Status berbagi (cermin dari izin Google Drive, untuk lencana di UI).
alter table public.documents
  add column if not exists share_public boolean not null default false,
  add column if not exists share_emails text[] not null default '{}';

-- Relasi many-to-many: satu dokumen bisa masuk banyak kategori
-- tanpa menyalin file.
create table if not exists public.document_categories (
  document_id uuid not null references public.documents(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, category_id)
);

create index if not exists document_categories_category_id_idx
  on public.document_categories (category_id);

-- ------------------------------------------------------------
-- Keamanan: RLS aktif TANPA policy untuk anon/authenticated.
-- Artinya anon key (yang bersifat publik) tidak bisa membaca/menulis apa pun.
-- Aplikasi mengakses database dari server memakai SUPABASE_SERVICE_ROLE_KEY,
-- yang melewati RLS dan tidak pernah dikirim ke browser.
-- Aman dijalankan ulang: policy development lama ikut dihapus.
-- ------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_categories enable row level security;

drop policy if exists "categories_dev_all" on public.categories;
drop policy if exists "documents_dev_all" on public.documents;
drop policy if exists "document_categories_dev_all" on public.document_categories;

revoke all on public.categories, public.documents, public.document_categories
  from anon, authenticated;
