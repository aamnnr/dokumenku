# Dokumenku

> Manajemen dokumen pribadi tanpa duplikasi file. Berkas di Google Drive, metadata di Supabase, dibangun dengan Next.js 16.

Satu file hanya disimpan **satu kali** di Google Drive. Bila file yang sama dimasukkan ke beberapa kategori, aplikasi cukup menautkannya, tanpa mengunggah ulang atau membuat salinan. Aplikasi ini dirancang untuk **satu pemilik**: hanya akun Google yang terdaftar di `OWNER_EMAIL` yang bisa masuk.

## Fitur

- **Login Google khusus pemilik** dengan sesi cookie bertanda tangan; seluruh halaman dan API terlindungi.
- **Unggah langsung ke Google Drive** (resumable, hingga 100 MB) dengan progres, seret-dan-lepas, serta deduplikasi otomatis berbasis MD5.
- **Impor dari Google Drive**: pilih file yang sudah ada di Drive lewat Google Picker; file dicatat tanpa diunggah ulang atau dipindahkan.
- **Kategori/folder** many-to-many: satu dokumen bisa masuk banyak kategori. Ada favorit, pencarian, serta filter jenis file dan urutan.
- **Kelola dokumen**: ganti nama, atur kategori, dan hapus (file dipindah ke Sampah Drive).
- **Unduh & bagikan**: tautan publik yang bisa dicabut, akses ke email tertentu dengan masa berlaku, dan kirim file langsung lewat lembar bagikan perangkat.
- **PWA**: bisa dipasang di HP/desktop, ada halaman offline, dan navigasi bawah di mobile.
- **Animasi halus** dengan View Transitions React; otomatis nonaktif bila pengguna memilih "kurangi animasi".

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Aplikasi | [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components), React 19.3, TypeScript |
| Tampilan | Tailwind CSS 4, [lucide-react](https://lucide.dev) |
| Metadata | [Supabase](https://supabase.com) (Postgres, RLS terkunci, akses via service role di server) |
| Berkas | Google Drive API v3 (scope `drive.file`) |
| Hosting | [Vercel](https://vercel.com) |

## Mulai cepat (lokal)

**Prasyarat:** Node.js ≥ 20.9, akun Google, dan proyek Supabase.

```bash
git clone https://github.com/<username>/dokumenku.git
cd dokumenku
npm install
cp .env.example .env.local      # lalu isi nilainya (lihat di bawah)
```

1. **Supabase**: buka *SQL Editor*, jalankan isi [`supabase/schema.sql`](supabase/schema.sql), lalu salin URL proyek dan **service_role key** ke `.env.local`.
2. **Google Cloud Console**:
   - aktifkan **Google Drive API**;
   - buat *OAuth client* bertipe **Web application** dengan redirect URI `http://localhost:3000/api/auth/callback`;
   - tambahkan email Anda sebagai *Test user*;
   - salin Client ID dan Client Secret ke `.env.local`.

   Panduan lengkapnya ada di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#2-google-cloud-console).
3. **Isi sisa variabel**: `OWNER_EMAIL` dan `AUTH_SECRET`. `AUTH_SECRET` bisa dibuat dengan:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

4. **Token & folder Drive** (pastikan `npm run dev` sedang tidak berjalan):

   ```bash
   npm run drive:token     # login Google, refresh token disimpan ke .env.local
   npm run drive:folder    # membuat folder "Dokumenku" di Drive, ID-nya disimpan
   ```

5. **Jalankan**:

   ```bash
   npm run dev             # http://localhost:3000
   ```

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` / `npm run start` | Build dan jalankan mode produksi (PWA aktif di mode ini) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run check` | Lint + typecheck + build; jalankan sebelum push |
| `npm run drive:token` | Membuat `GOOGLE_REFRESH_TOKEN` lalu menyimpannya ke `.env.local` |
| `npm run drive:folder` | Membuat folder tujuan di Drive lalu menyimpan `GOOGLE_DRIVE_FOLDER_ID` |

## Environment variable

Daftar lengkap beserta penjelasannya ada di [`.env.example`](.env.example).

| Variabel | Wajib | Keterangan |
| --- | :---: | --- |
| `OWNER_EMAIL` | ✅ | Email Google yang boleh masuk (pisahkan dengan koma bila lebih dari satu) |
| `AUTH_SECRET` | ✅ | Kunci acak ≥ 32 karakter untuk menandatangani sesi |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ | Kredensial OAuth client |
| `GOOGLE_REFRESH_TOKEN` | ✅ | Akses Drive milik pemilik (`npm run drive:token`) |
| `GOOGLE_DRIVE_FOLDER_ID` | – | Folder tujuan unggahan (`npm run drive:folder`) |
| `GOOGLE_PICKER_API_KEY` | – | API key untuk fitur Impor dari Google Drive |
| `GOOGLE_CLOUD_PROJECT_NUMBER` | – | Nomor project Google Cloud; default diambil dari awalan `GOOGLE_CLIENT_ID` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL proyek Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Kunci rahasia, **khusus server** |

## Struktur proyek

```
src/
├─ proxy.ts              Penjaga akses: tamu diarahkan ke /login, API dibalas 401
├─ app/
│  ├─ (app)/             Layout bersama (data + navigasi + modal) dan halaman:
│  │                     / Beranda, /favorit, /kategori, /akun
│  ├─ login/, privacy/   Halaman masuk & kebijakan privasi
│  ├─ manifest.ts        Manifest PWA
│  └─ api/               Route handler (auth, upload, documents, share, …)
├─ components/           AppShell (context), Sidebar, MobileBottomNav, FolderGrid,
│  │                     DocumentGrid, DocumentViewer (pratinjau)
│  ├─ views/             Isi halaman: Home, Favorites, Categories, Account
│  ├─ modals/            Upload, Kategori (buat/ubah), Hapus kategori, Edit, Hapus, Bagikan
│  └─ ui/                Modal (bottom sheet), Popover, Select, FilterPill, Logo, ikon
├─ lib/                  auth, session, drive, sharing, supabase, queries, pwa, …
└─ types/                Tipe domain & skema database
public/                  Ikon PWA, logo, service worker, halaman offline
scripts/                 drive-token.mjs, drive-folder.mjs
supabase/                schema.sql & migrations/
docs/                    Dokumentasi lanjutan
```

## Dokumentasi

- 🚀 [Deploy ke Vercel + domain sendiri](docs/DEPLOYMENT.md)
- 🧩 [Arsitektur & cara kerja](docs/ARCHITECTURE.md): upload, deduplikasi, berbagi, PWA, dan animasi
- 🔌 [Referensi API](docs/API.md)

## Keamanan

- Hanya `OWNER_EMAIL` yang bisa masuk. Sesi tersimpan di cookie `httpOnly` bertanda tangan HMAC dan berlaku 7 hari.
- Akses diperiksa dua kali: di `proxy.ts` dan di setiap route handler.
- Tabel Supabase terkunci RLS, sehingga *anon key* tidak bisa membaca atau menulis apa pun. Server memakai service role key yang tidak pernah dikirim ke browser.
- Scope Drive `drive.file` membuat aplikasi hanya bisa mengakses file yang diunggahnya sendiri atau yang dipilih pemilik lewat Google Picker.
- Tautan publik bisa dibuka siapa saja yang memegangnya. Untuk dokumen sensitif (KTP, KK, dan sejenisnya), sebaiknya bagikan ke email tertentu dengan masa berlaku.
- **Jangan pernah commit `.env.local`.** Bila sebuah kunci sempat terekspos, putar ulang (*rotate*) kunci tersebut.

## Impor dari Google Drive

File yang ditaruh langsung ke Drive tidak otomatis muncul, karena scope `drive.file` tidak memberi akses ke file lain. Gunakan tombol **Impor dari Google Drive** di lembar Unggah: file yang dipilih di Google Picker otomatis bisa diakses aplikasi, lalu dicatat di database. File tetap di lokasi aslinya di Drive.

Bila `GOOGLE_DRIVE_FOLDER_ID` diatur, impor **hanya untuk file yang berada langsung di folder Dokumenku**: Picker terbuka di folder itu tanpa subfolder, dan server menolak file dari luar folder. Bila tidak diatur, Picker menampilkan seluruh Drive.

Penyiapan (sekali saja, di project Google Cloud yang sama dengan OAuth client):

1. **APIs & Services → Library**: aktifkan **Google Picker API**.
2. **APIs & Services → Credentials → Create credentials → API key**. Batasi key tersebut:
   - *Application restrictions*: **Websites**, isi `http://localhost:3000/*` dan domain produksi, mis. `https://dokumen.contoh.com/*`.
   - *API restrictions*: hanya **Google Picker API**.
3. Isi `GOOGLE_PICKER_API_KEY` di `.env.local` dan di Vercel.
4. Opsional: `GOOGLE_CLOUD_PROJECT_NUMBER` (Cloud Console → beranda project). Bila kosong, diambil dari awalan angka `GOOGLE_CLIENT_ID`.

Catatan:

- Google Docs/Sheets/Slides belum bisa diimpor; unduh sebagai PDF atau Office dulu.
- Menghapus dokumen hasil impor di aplikasi juga memindahkan file aslinya ke Sampah Drive (bisa dipulihkan 30 hari).

## Pemecahan masalah

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| "Supabase belum dikonfigurasi" | `SUPABASE_SERVICE_ROLE_KEY` kosong | Isi dari *Project Settings → API*, lalu restart |
| "AUTH_SECRET belum diisi" | Kosong atau kurang dari 32 karakter | Buat dengan perintah di bagian Mulai cepat |
| "Akun Google ini tidak diizinkan" | Email bukan `OWNER_EMAIL` | Periksa `OWNER_EMAIL` |
| Google `redirect_uri_mismatch` | Callback belum didaftarkan | Tambahkan `<origin>/api/auth/callback` di *Clients* |
| Google "Akses diblokir / Error 403" | Status *Testing* dan email belum jadi test user | *Audience → Test users*, atau publish aplikasi |
| "Token Google Drive kedaluwarsa atau dicabut" | Token dibuat saat status *Testing* (7 hari) | Publish aplikasi, `npm run drive:token`, lalu perbarui di Vercel |
| "Google Drive API has not been used… disabled" | Drive API belum aktif | *APIs & Services → Library → Google Drive API → Enable* |
| Unggah gagal / 404 folder | Folder dibuat manual | `npm run drive:folder` |
| Lencana "Dibagikan" tidak muncul | Migrasi berbagi belum dijalankan | Jalankan [`supabase/migrations/20261119_sharing.sql`](supabase/migrations/20261119_sharing.sql) |
| Peringatan hidrasi `cz-shortcut-listen` | Ekstensi browser (ColorZilla) | Abaikan; sudah diredam di `layout.tsx` |
