"use client";

import React, { useRef, useState } from "react";
import { HardDrive, UploadCloud, X } from "lucide-react";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes, getFileKind, getFileLabel } from "@/lib/file-types";
import { pickDriveFiles } from "@/lib/google-picker";
import type { CategoryWithDocs } from "@/types";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import FileKindIcon, { FILE_KIND_STYLES } from "@/components/ui/FileKindIcon";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithDocs[];
  defaultCategoryId: string;
  onSuccess: (documentId?: string) => void;
  showToast: (msg: string) => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 bg-white";

export default function UploadModal({
  open,
  onClose,
  categories,
  defaultCategoryId,
  onSuccess,
  showToast,
}: UploadModalProps) {
  const [docTitle, setDocTitle] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState(defaultCategoryId);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const busy = uploading || importing;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (picked: File | null | undefined) => {
    setError(null);
    if (!picked) return;
    if (picked.size === 0) {
      setError("File kosong tidak dapat diunggah.");
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setError(`Ukuran file maksimal ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setFile(picked);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Pilih file terlebih dahulu.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Minta sesi unggah ke server (hanya metadata yang dikirim).
      const sessionRes = await fetch("/api/upload/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle.trim() || file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          categoryId: targetCategoryId || undefined,
        }),
      });
      const session = await sessionRes.json();
      if (!sessionRes.ok) {
        setError(session.error ?? "Gagal menyiapkan unggahan.");
        return;
      }

      // 2. Kirim isi file langsung ke Google Drive.
      const fileId = await uploadToDrive(session.uploadUrl, file, setProgress);

      // 3. Catat dokumen di database.
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, categoryId: targetCategoryId || undefined }),
      });
      const result = await completeRes.json();

      if (completeRes.ok) {
        onClose();
        showToast(result.message);
        onSuccess(result.documentId);
        return;
      }

      setError(result.error ?? "Gagal menyimpan dokumen.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Tidak dapat terhubung ke server. Coba lagi."
      );
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  /** Pilih file yang sudah ada di Google Drive lalu catat tanpa mengunggah ulang. */
  const handleImport = async () => {
    setError(null);
    setImporting(true);
    try {
      const picked = await pickDriveFiles();
      if (!picked || picked.length === 0) return;

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: picked.map((item) => item.id),
          categoryId: targetCategoryId || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Gagal mengimpor dari Google Drive.");
        return;
      }
      onClose();
      showToast(result.message);
      onSuccess(result.documentIds?.[0]);
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Tidak dapat terhubung ke Google Drive."
      );
    } finally {
      setImporting(false);
    }
  };

  const kind = file ? getFileKind(file.type, file.name) : "other";

  return (
    <Modal open={open} title="Unggah Dokumen" onClose={onClose} locked={busy}>
      <form onSubmit={handleUpload} noValidate className="space-y-4">
        {/* Area seret & lepas */}
        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              pickFile(event.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/60 scale-[1.01]"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <UploadCloud className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isDragging ? "-translate-y-1 scale-110" : ""}`} />
            </div>
            <p className="text-sm font-medium text-gray-800">
              {isDragging ? "Lepaskan file di sini" : "Seret file ke sini atau klik untuk memilih"}
            </p>
            <p className="text-[11px] text-gray-400">
              Maks. {MAX_UPLOAD_BYTES / 1024 / 1024} MB · dikirim langsung ke Google Drive
            </p>
          </div>
        ) : (
          <div className="motion-rise flex items-center gap-3 p-3 rounded-2xl border border-gray-200">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${FILE_KIND_STYLES[kind].chip}`}
            >
              <FileKindIcon kind={kind} className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-[11px] text-gray-400">
                {getFileLabel(file.name, file.type)} · {formatBytes(file.size)}
              </p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Ganti file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            pickFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {!file && (
          <>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span className="h-px flex-1 bg-gray-100" />
              atau
              <span className="h-px flex-1 bg-gray-100" />
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={busy}
              className="press w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-gray-200 text-left hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4 text-gray-600" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-800">
                  {importing ? "Membuka Google Drive…" : "Impor dari Google Drive"}
                </span>
                <span className="block text-[11px] text-gray-400">
                  Pilih file yang sudah ada di Drive, tanpa mengunggah ulang
                </span>
              </span>
            </button>
          </>
        )}

        <div>
          <p className="block text-xs font-medium text-gray-700 mb-1.5">
            Kategori <span className="text-gray-400 font-normal">(opsional)</span>
          </p>
          <Select
            label="Kategori"
            value={targetCategoryId}
            onChange={setTargetCategoryId}
            disabled={busy}
            options={[
              { value: "", label: "Tanpa kategori", hint: "Bisa ditautkan nanti lewat Edit" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
                hint: category.description ?? undefined,
              })),
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Nama dokumen <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            placeholder={file?.name ?? "Contoh: KTP Utama, Ijazah S1"}
            value={docTitle}
            onChange={(event) => setDocTitle(event.target.value)}
            className={inputClass}
            disabled={busy}
          />
        </div>

        {progress !== null && (
          <div className="motion-rise">
            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>{progress < 100 ? "Mengunggah ke Google Drive…" : "Menyimpan…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy || !file}
            className="press px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-40"
          >
            {uploading ? "Mengunggah..." : "Unggah File"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Kirim file ke URL sesi resumable Google Drive. Memakai XMLHttpRequest
 * karena fetch belum menyediakan progres unggahan.
 */
function uploadToDrive(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { id } = JSON.parse(xhr.responseText) as { id?: string };
          if (id) {
            onProgress(100);
            resolve(id);
            return;
          }
        } catch {
          // jatuh ke reject di bawah
        }
      }
      reject(new Error(`Unggah ke Google Drive gagal (status ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Koneksi ke Google Drive terputus. Coba lagi."));

    xhr.send(file);
  });
}
