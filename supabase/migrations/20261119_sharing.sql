-- Dokumenku — status berbagi dokumen (untuk lencana "Dibagikan" di UI).
-- Sumber kebenaran tetap izin di Google Drive; kolom ini hanya cermin.
-- Aman dijalankan berulang.
alter table public.documents
  add column if not exists share_public boolean not null default false,
  add column if not exists share_emails text[] not null default '{}';
