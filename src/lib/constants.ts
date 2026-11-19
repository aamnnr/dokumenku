/**
 * Batas ukuran unggahan (100 MB). File dikirim langsung dari browser ke
 * Google Drive, jadi tidak terkena batas body 4,5 MB milik Vercel.
 */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Kunci penyimpanan lokal untuk kategori favorit. */
export const FAVORITES_STORAGE_KEY = "dokumenku:favorites";

/**
 * Batas "Kirim file" lewat lembar bagikan perangkat. File melewati server,
 * jadi dijaga di bawah batas respons Vercel (4,5 MB).
 */
export const SHARE_FILE_MAX_BYTES = 4 * 1024 * 1024;
