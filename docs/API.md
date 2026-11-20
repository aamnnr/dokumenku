# Referensi API

Semua endpoint selain `/api/auth/*` **mewajibkan sesi login** (cookie `dokumenku_session`). Tanpa sesi, server membalas:

```json
{ "success": false, "error": "Sesi berakhir. Silakan masuk kembali." }
```

dengan status `401`. Semua respons error berbentuk `{ success: false, error }`.

## Autentikasi

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/auth/login` | Mengarahkan ke halaman login Google |
| `GET` | `/api/auth/callback` | Callback OAuth: memverifikasi pemilik dan membuat sesi, lalu mengarahkan ke `/` (atau `/login?error=…`) |
| `POST` | `/api/auth/logout` | Menghapus sesi, lalu mengarahkan ke `/login` |

## Kategori & dokumen

| Method | Endpoint | Body | Respons |
| --- | --- | --- | --- |
| `GET` | `/api/documents` | – | `{ success, categories: CategoryWithDocs[], uncategorized: DocumentItem[] }` |
| `POST` | `/api/categories` | `{ name, description? }` | `{ success, category }` · `409` bila nama sudah ada |
| `PATCH` | `/api/categories/:id` | `{ name?, description? }` | `{ success, message }` · `409` bila nama sudah ada |
| `DELETE` | `/api/categories/:id` | – | `{ success, message }`; dokumen di dalamnya tidak ikut terhapus |
| `PATCH` | `/api/documents/:id` | `{ title?, categoryIds? }` | `{ success, message }`; `categoryIds: []` melepas dokumen dari semua kategori, dan nama file di Drive ikut diganti |
| `DELETE` | `/api/documents/:id` | – | `{ success, message }`; file dipindah ke Sampah Drive dan baris DB dihapus |
| `GET` | `/api/preview?fileKey=` | – | `{ success, url }`: tautan pratinjau Google Drive |

## Unggah

| Method | Endpoint | Body | Respons |
| --- | --- | --- | --- |
| `POST` | `/api/upload/session` | `{ title, mimeType, size, categoryId? }` | `{ success, uploadUrl }` · `413` bila lebih dari 100 MB |
| `PUT` | `uploadUrl` (Google) | isi file mentah | `{ id }` |
| `POST` | `/api/upload/complete` | `{ fileId, categoryId? }` | `{ success, documentId, deduplicated, message }` |

## Impor dari Google Drive

| Method | Endpoint | Body | Respons |
| --- | --- | --- | --- |
| `GET` | `/api/import/token` | – | `{ success, accessToken, apiKey, appId }` untuk membuka Google Picker; tidak di-cache |
| `POST` | `/api/import` | `{ fileIds: string[] (maks. 50), categoryId? }` | `{ success, documentIds, imported, existing, skipped: [{ name, reason }], message }` · `422` bila tidak ada file yang bisa diimpor |

File tidak disalin atau dipindahkan. File yang isinya sudah tercatat (MD5 sama) tidak dicatat dua kali, cukup ditautkan ke kategori.

## Unduh & berbagi

| Method | Endpoint | Body | Respons |
| --- | --- | --- | --- |
| `GET` | `/api/documents/:id/download` | – | `302` ke tautan unduhan Google Drive |
| `GET` | `/api/documents/:id/file` | – | Isi file mentah (≤ 4 MB) · `413` bila lebih besar |
| `GET` | `/api/documents/:id/share` | – | `{ success, share: ShareState }` |
| `POST` | `/api/documents/:id/share` | lihat di bawah | `{ success, message, share: ShareState }` |

Aksi pada `POST /api/documents/:id/share`:

```jsonc
{ "action": "public-on" }                       // aktifkan tautan publik
{ "action": "public-off" }                      // matikan tautan publik
{ "action": "add-email",                        // beri akses lihat ke email
  "email": "nama@contoh.com",
  "expiresInDays": 7,                           // opsional, 0–365 (0 = tanpa batas)
  "message": "Ini dokumennya" }                 // opsional, dikirim di email Google
{ "action": "remove-email", "permissionId": "…" } // cabut akses
```

```ts
interface ShareState {
  public: boolean;
  link: string | null; // tautan pratinjau Google Drive
  emails: { permissionId: string; email: string; expiresAt: string | null }[];
}
```
