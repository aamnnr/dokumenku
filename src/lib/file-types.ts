/** Pengelompokan jenis file untuk filter, ikon, dan label di UI. */
export type FileKind = "pdf" | "image" | "doc" | "sheet" | "slide" | "archive" | "other";

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  pdf: "PDF",
  image: "Gambar",
  doc: "Dokumen",
  sheet: "Spreadsheet",
  slide: "Presentasi",
  archive: "Arsip",
  other: "Lainnya",
};

export function getFileKind(mimeType: string, title = ""): FileKind {
  const mime = mimeType.toLowerCase();
  const ext = title.includes(".") ? title.split(".").pop()!.toLowerCase() : "";

  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (/sheet|excel|csv/.test(mime) || ["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (/presentation|powerpoint/.test(mime) || ["ppt", "pptx", "odp"].includes(ext)) return "slide";
  if (/word|opendocument\.text|rtf|text\/plain/.test(mime) || ["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return "doc";
  if (/zip|rar|7z|tar|gzip/.test(mime) || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  return "other";
}

/** Label pendek seperti "PDF", "JPG", "DOCX". */
export function getFileLabel(title: string, mimeType: string): string {
  const extension = title.includes(".") ? title.split(".").pop() : "";
  if (extension && extension.length <= 5) return extension.toUpperCase();
  const subtype = mimeType.split("/")[1] ?? "";
  return subtype && subtype.length <= 5 ? subtype.toUpperCase() : "FILE";
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

const relativeFormatter = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

export function formatRelativeDate(iso: string): string {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return "baru saja";
}
