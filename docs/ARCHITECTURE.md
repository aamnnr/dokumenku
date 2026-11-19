# Arsitektur & cara kerja

## Gambaran besar

```
 Browser (PWA)                  Next.js di Vercel                     Layanan
 ─────────────                  ─────────────────                     ───────
 Dashboard ── fetch ─────────▶  proxy.ts (cek sesi)
                                Route handlers /api/* ─── service role ──▶ Supabase (metadata)
                                                     └── refresh token ──▶ Google Drive API
 Upload ────────── PUT isi file langsung (resumable) ───────────────────▶ Google Drive
 Unduh ─────────── redirect ke tautan unduhan resmi ────────────────────▶ Google Drive
```

- **Supabase** hanya menyimpan metadata: kategori, dokumen, relasi, dan status berbagi.
- **Google Drive** menyimpan file aslinya, di dalam folder yang dibuat aplikasi.
- Server memegang **refresh token** milik pemilik, sehingga browser tidak pernah memegang kredensial Google.

## Model data

```
categories ──< document_categories >── documents
```

| Tabel | Isi penting |
| --- | --- |
| `categories` | `name` (unik), `description` |
| `documents` | `file_key` (ID file Drive), `file_hash` (MD5, **unik**), `mime_type`, `file_size`, `share_public`, `share_emails` |
| `document_categories` | pasangan `document_id` + `category_id` (many-to-many, `ON DELETE CASCADE`) |

RLS aktif **tanpa policy** untuk `anon` dan `authenticated`, jadi *anon key* tidak bisa melakukan apa pun. Semua akses database dilakukan dari server memakai service role key.

## Autentikasi

1. `/api/auth/login` mengarahkan ke Google (scope `openid email`) dengan `state` acak yang disimpan di cookie.
2. `/api/auth/callback` memverifikasi `state`, menukar kode, lalu memverifikasi **ID token**: email harus terverifikasi dan termasuk dalam `OWNER_EMAIL`.
3. Server membuat cookie `dokumenku_session` berisi `{ email, exp }` yang ditandatangani **HMAC-SHA256** dengan `AUTH_SECRET`. Cookie ini `httpOnly`, `SameSite=Lax`, dan `Secure` di produksi.
4. `proxy.ts` memeriksa cookie di setiap request: tamu yang membuka halaman diarahkan ke `/login`, sedangkan permintaan API dibalas `401`. Setiap route handler memeriksa ulang lewat `requireOwner()`.

Redirect URI dihitung dari origin request, sehingga kode yang sama otomatis bekerja di `localhost`, `*.vercel.app`, maupun domain sendiri.

## Unggah & deduplikasi

```
Browser                         Server                              Google Drive
   │ POST /api/upload/session ──▶ validasi + buat sesi resumable ──▶ (Location: uploadUrl)
   │ ◀── { uploadUrl } ───────────┘
   │ PUT isi file ────────────────────────────────────────────────▶ simpan file
   │ ◀── { id } ──────────────────────────────────────────────────┘
   │ POST /api/upload/complete ─▶ baca size + md5Checksum dari Drive
   │                              ├─ MD5 sudah ada?  → hapus file baru, tautkan dokumen lama
   │                              └─ belum ada       → simpan baris dokumen
```

- Isi file **tidak melewati server**, sehingga batas body 4,5 MB di Vercel tidak berlaku. Batas ukurannya 100 MB (`MAX_UPLOAD_BYTES`).
- Sesi upload dibuat dengan header `Origin` milik aplikasi, agar Google mengizinkan CORS dari browser.
- Ukuran dan MD5 diambil dari Drive, bukan dari klien, sehingga tidak bisa dipalsukan.
- Kolom `file_hash` bersifat `UNIQUE`. Bila dua unggahan bersamaan berisi konten yang sama, yang kalah otomatis ditautkan ke dokumen yang menang, dan file duplikatnya dihapus.

## Unduh & berbagi

| Aksi | Implementasi |
| --- | --- |
| Unduh | `GET /api/documents/:id/download` mengirim 302 ke `webContentLink` Drive, sehingga file diunduh langsung dari Google |
| Tautan publik | Izin Drive `type: anyone, role: reader, allowFileDiscovery: false`; mematikannya berarti menghapus izin tersebut |
| Ke email | Izin Drive `type: user, role: reader` dengan `expirationTime` opsional; Google mengirim email pemberitahuan |
| Kirim file | `GET /api/documents/:id/file` mengalirkan isi file (≤ 4 MB), lalu browser memanggil `navigator.share({ files })` |

Sumber kebenaran status berbagi adalah **izin di Google Drive**. Kolom `share_public` dan `share_emails` hanya cermin untuk menampilkan lencana di kartu. Bila kolom itu belum ada (migrasi belum dijalankan), aplikasi tetap berjalan tanpa lencana.

## Scope Google Drive `drive.file`

Aplikasi hanya bisa melihat dan mengubah file serta folder **yang dibuatnya sendiri**. Ada beberapa konsekuensinya:

- File lain di Drive Anda tidak pernah terbaca oleh aplikasi.
- Folder tujuan harus dibuat lewat `npm run drive:folder`, bukan secara manual.
- Scope ini tergolong *non-sensitive*, sehingga aplikasi bisa di-publish tanpa verifikasi Google.

## PWA

- `src/app/manifest.ts`: manifest berisi nama, warna, dan ikon (`public/icons/`, termasuk versi *maskable*).
- `public/sw.js`: service worker yang **tidak pernah menyimpan halaman atau respons API ke cache**, karena datanya pribadi. Yang di-cache hanya aset statis ber-hash dan `offline.html`.
- Service worker hanya didaftarkan di mode produksi (`src/lib/pwa.ts`).
- Tombol **Pasang aplikasi** memakai event `beforeinstallprompt`. Di iOS, yang ditampilkan adalah petunjuk "Tambah ke Layar Utama".

## Animasi

- **View Transitions React** (`<ViewTransition>`) dipakai untuk perpindahan halaman berarah (`PageTransition` + `transitionTypes`), pergantian skeleton ke konten, pergantian judul, serta kartu yang masuk, keluar, atau pindah posisi saat folder, filter, urutan, atau pencarian berubah. Perubahan state dibungkus `startTransition` atau `useDeferredValue`.
- **Animasi CSS** (`globals.css`, kelas `motion-*`) dipakai untuk modal dan bottom sheet, menu, toast, bintang favorit, sorotan kartu, dan skeleton shimmer. Hook `usePresence` menahan elemen sebentar agar animasi keluarnya sempat diputar.
- Elemen "jangkar" (header, navigasi bawah, toast, modal) diberi `view-transition-name` sendiri, supaya tetap berada di atas kartu selama transisi.
- Semua animasi dimatikan bila OS memakai `prefers-reduced-motion`.

## Keputusan desain

| Keputusan | Alasan |
| --- | --- |
| Satu pemilik via `OWNER_EMAIL`, tanpa Supabase Auth | Aplikasi pribadi; lebih sederhana dan tanpa tabel pengguna |
| Upload langsung ke Drive | Menghindari batas body serverless dan menghemat bandwidth server |
| MD5 dari Drive untuk deduplikasi | Browser tidak menyediakan MD5 secara native, dan nilai dari server tidak bisa dipalsukan |
| Hapus berarti memindahkan ke Sampah Drive | Bisa dipulihkan selama 30 hari |
| Service role key di server, RLS terkunci | Anon key yang bersifat publik tidak bisa menyentuh data |
