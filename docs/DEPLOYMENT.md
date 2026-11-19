# Deploy ke Vercel dengan domain sendiri

Panduan ini membawa Dokumenku dari lokal ke produksi di **Vercel**, memakai subdomain dari domain sendiri.

> Contoh di bawah memakai **`dokumen.nuramin.my.id`**. Ganti dengan subdomain pilihan Anda (misalnya `docs.`, `arsip.`, atau `berkas.`) secara konsisten di semua langkah.

## Ringkasan urutan

1. [Push ke GitHub](#1-push-ke-github)
2. [Google Cloud Console](#2-google-cloud-console): verifikasi domain, Branding, redirect URI, lalu **Publish**
3. [Supabase](#3-supabase): skema & migrasi
4. [Vercel](#4-vercel): import proyek & environment variable
5. [Domain](#5-subdomain-di-vercel): pasang subdomain dan DNS
6. [Token Drive produksi](#6-refresh-token-produksi): buat ulang setelah publish
7. [Verifikasi](#7-checklist-setelah-deploy)

---

## 1. Push ke GitHub

Sebelum push, pastikan semua pemeriksaan lolos:

```bash
npm run check          # lint + typecheck + build
```

Buat repositori **kosong** di GitHub (tanpa README atau .gitignore), lalu:

```bash
git branch -m master main          # samakan dengan nama branch default GitHub
git add -A
git status                         # pastikan .env.local TIDAK ada di daftar
git commit -m "Dokumenku v1.0.0"
git remote add origin https://github.com/<username>/dokumenku.git
git push -u origin main
```

> `.env.local` dan semua file `.env*` sudah di-ignore. Hanya `.env.example` (tanpa nilai) yang ikut ter-push. Disarankan repositorinya dibuat **Private**.

## 2. Google Cloud Console

Buka [console.cloud.google.com](https://console.cloud.google.com) dan pilih proyek yang dipakai untuk Dokumenku.

### 2.1 Verifikasi kepemilikan domain

Google mewajibkan domain yang dipakai di layar persetujuan OAuth terdaftar sebagai *Authorized domain*, dan untuk itu domain perlu diverifikasi.

1. Buka [Google Search Console](https://search.google.com/search-console), pilih **Tambahkan properti**, lalu pilih tipe **Domain** dan isi `nuramin.my.id`.
2. Salin record **TXT** yang diberikan, lalu tambahkan di pengelola DNS domain Anda:

   | Tipe | Nama/Host | Nilai |
   | --- | --- | --- |
   | `TXT` | `@` | `google-site-verification=…` |

3. Klik **Verifikasi**. Propagasi DNS bisa memakan waktu beberapa menit hingga beberapa jam.

Verifikasi di level domain otomatis berlaku untuk semua subdomain.

### 2.2 Branding (Google Auth Platform → Branding)

| Kolom | Isi |
| --- | --- |
| App name | `Dokumenku` |
| User support email | email Anda |
| Application home page | `https://dokumen.nuramin.my.id` |
| Application privacy policy link | `https://dokumen.nuramin.my.id/privacy` |
| Authorized domains | `nuramin.my.id` |
| Developer contact information | email Anda (tekan Enter sampai menjadi *chip*) |

**Jangan unggah logo** di sini. Mengunggah logo membuat aplikasi wajib melewati verifikasi Google.

### 2.3 Data Access

Tambahkan scope berikut: `openid`, `.../auth/userinfo.email`, dan `.../auth/drive.file`. Ketiganya termasuk kategori *non-sensitive*.

### 2.4 Clients → OAuth client (Web application)

Pada **Authorized redirect URIs**, isi:

```
http://localhost:3000/api/auth/callback
https://dokumen.nuramin.my.id/api/auth/callback
```

Opsional: tambahkan juga `https://<nama-proyek>.vercel.app/api/auth/callback` bila ingin bisa login lewat domain bawaan Vercel.

### 2.5 Audience → Publish app

Klik **Publish app**, lalu **Confirm**. Statusnya akan berubah menjadi **In production**.

- Karena semua scope bersifat *non-sensitive*, umumnya tidak diperlukan verifikasi Google.
- Selama aplikasi belum diverifikasi, layar login menampilkan peringatan *"Google hasn't verified this app"*. Klik **Continue**. Ini aman karena hanya Anda yang memakainya.
- **Mengapa harus publish:** refresh token yang dibuat saat status *Testing* kedaluwarsa setelah 7 hari.

## 3. Supabase

1. Buka **SQL Editor**, lalu jalankan [`supabase/schema.sql`](../supabase/schema.sql). Skrip ini aman dijalankan ulang, dan sudah mencakup kolom berbagi.
2. Bila database sudah dibuat sebelum fitur berbagi ditambahkan, jalankan juga [`supabase/migrations/20261119_sharing.sql`](../supabase/migrations/20261119_sharing.sql).
3. Dari **Project Settings → API**, catat:
   - **Project URL**, untuk `NEXT_PUBLIC_SUPABASE_URL`;
   - **service_role / secret key**, untuk `SUPABASE_SERVICE_ROLE_KEY` (rahasia).
4. Catat juga **region** proyek (misalnya Singapore). Region ini akan dipakai di langkah 4.

## 4. Vercel

1. Di [vercel.com/new](https://vercel.com/new), klik **Import** pada repositori `dokumenku`. Framework akan terdeteksi otomatis sebagai Next.js; build command dan output tidak perlu diubah.
2. Buka **Environment Variables** dan isi semua variabel berikut untuk environment **Production**:

   | Variabel | Nilai |
   | --- | --- |
   | `OWNER_EMAIL` | email Google Anda |
   | `AUTH_SECRET` | **buat baru, berbeda dari lokal**: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `GOOGLE_CLIENT_ID` | dari Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | dari Google Cloud Console |
   | `GOOGLE_REFRESH_TOKEN` | sementara isi dengan token lokal; ganti di langkah 6 |
   | `GOOGLE_DRIVE_FOLDER_ID` | sama dengan di `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_URL` | dari Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase |

3. Klik **Deploy**.
4. *(Disarankan)* Buka **Settings → Functions → Function Region** dan pilih region yang sama atau terdekat dengan region Supabase (misalnya **Singapore, `sin1`**). Setelah itu redeploy. Ini mengurangi latensi setiap permintaan ke database.

> **Preview deployment** (dari branch selain `main`) memakai URL acak, sehingga login Google akan gagal dengan `redirect_uri_mismatch`. Hal ini normal. Gunakan domain produksi untuk login.

## 5. Subdomain di Vercel

1. Buka **Project → Settings → Domains**, pilih **Add**, lalu isi `dokumen.nuramin.my.id`.
2. Vercel akan menampilkan record DNS yang dibutuhkan. Tambahkan record itu di pengelola DNS `nuramin.my.id`:

   | Tipe | Nama/Host | Nilai |
   | --- | --- | --- |
   | `CNAME` | `dokumen` | nilai yang ditampilkan Vercel (misalnya `cname.vercel-dns.com`) |

   Gunakan **persis** nilai yang ditampilkan Vercel, karena nilainya bisa berbeda per proyek. Bila DNS Anda dikelola Cloudflare, set proxy ke **DNS only** (awan abu-abu) agar sertifikat SSL Vercel bisa terbit.

3. Tunggu sampai status domain di Vercel berubah menjadi **Valid Configuration**. Sertifikat HTTPS dibuat otomatis.

## 6. Refresh token produksi

Setelah aplikasi berstatus **In production** (langkah 2.5), buat token baru yang tidak akan kedaluwarsa:

```bash
# di komputer lokal, pastikan `npm run dev` tidak sedang berjalan
npm run drive:token
```

1. Buka tautan yang muncul, login dengan akun pemilik Drive, lalu klik **Continue**.
2. Token baru tersimpan otomatis di `.env.local`. Salin nilai `GOOGLE_REFRESH_TOKEN` dari sana ke Vercel (**Settings → Environment Variables**).
3. Buka **Deployments**, pilih deploy terakhir, lalu klik **⋯ → Redeploy** supaya nilai baru terbaca.

Token lama dari masa *Testing* boleh dibiarkan. Token itu akan kedaluwarsa dengan sendirinya.

## 7. Checklist setelah deploy

- [ ] `https://dokumen.nuramin.my.id` mengarahkan ke `/login`.
- [ ] Login dengan akun pemilik berhasil; akun lain ditolak.
- [ ] Buat kategori dan unggah file berukuran > 5 MB, lalu pastikan file muncul di folder **Dokumenku** di Google Drive.
- [ ] Unggah file yang sama ke kategori lain: muncul pesan "tanpa duplikasi".
- [ ] **Buka**, **Unduh**, dan **Bagikan → Tautan publik** berfungsi; tautan bisa dibuka dari jendela incognito.
- [ ] `curl -i https://dokumen.nuramin.my.id/api/documents` tanpa cookie menghasilkan `401`.
- [ ] Di HP, buka situsnya lalu pilih **Akun → Pasang aplikasi** (Android) atau **Bagikan → Tambah ke Layar Utama** (iOS).
- [ ] Di Chrome DevTools, **Application → Manifest** tidak menampilkan error.

## Perawatan

| Kejadian | Tindakan |
| --- | --- |
| Muncul "Token Google Drive kedaluwarsa atau dicabut" | `npm run drive:token`, perbarui di Vercel, lalu redeploy |
| Ingin memaksa semua sesi logout | Ganti `AUTH_SECRET` di Vercel, lalu redeploy |
| Kunci bocor | Putar ulang di sumbernya (Google: *Clients → Reset secret*; Supabase: *API → Roll key*), perbarui di Vercel, lalu redeploy |
| Mengganti subdomain | Tambahkan domain baru di Vercel, lalu perbarui *Branding* dan *Redirect URIs* di Google |
| Mengubah ikon/aset offline PWA | Naikkan `VERSION` di `public/sw.js` |
