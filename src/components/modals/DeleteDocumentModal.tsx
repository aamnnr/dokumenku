"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { DocumentWithCategories } from "@/types";
import Modal from "@/components/ui/Modal";

interface DeleteDocumentModalProps {
  open: boolean;
  document: DocumentWithCategories;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

export default function DeleteDocumentModal({
  open,
  document,
  onClose,
  onSuccess,
  showToast,
}: DeleteDocumentModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Gagal menghapus dokumen.");
      onClose();
      showToast(data.message);
      onSuccess();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} title="Hapus Dokumen?" onClose={onClose} locked={deleting}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="text-sm text-gray-600 space-y-2 min-w-0">
          <p>
            <strong className="text-gray-900 break-words">{document.title}</strong> akan dihapus
            dari Google Drive dan dari{" "}
            {document.categoryNames.length > 1
              ? `${document.categoryNames.length} kategori`
              : "kategorinya"}
            .
          </p>
          {document.categoryNames.length > 1 && (
            <p className="text-xs text-gray-500">
              Hanya ingin mengeluarkannya dari satu kategori? Gunakan <em>Edit</em>.
            </p>
          )}
          <p className="text-xs text-gray-400">
            File dipindahkan ke Sampah Google Drive dan masih bisa dipulihkan dari sana selama 30
            hari.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-5">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="press px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </Modal>
  );
}
