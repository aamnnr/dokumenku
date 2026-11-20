"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { CategoryWithDocs } from "@/types";
import Modal from "@/components/ui/Modal";

interface DeleteCategoryModalProps {
  open: boolean;
  category: CategoryWithDocs;
  /** Berapa dokumen yang akan menjadi "tanpa kategori" setelah dihapus. */
  orphanCount: number;
  onClose: () => void;
  onSuccess: (categoryId: string) => void;
  showToast: (msg: string) => void;
}

export default function DeleteCategoryModal({
  open,
  category,
  orphanCount,
  onClose,
  onSuccess,
  showToast,
}: DeleteCategoryModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = category.documents.length;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Gagal menghapus kategori.");
      onClose();
      showToast(data.message);
      onSuccess(category.id);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} title="Hapus Kategori?" onClose={onClose} locked={deleting}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="text-sm text-gray-600 space-y-2 min-w-0">
          <p>
            Kategori <strong className="text-gray-900 break-words">{category.name}</strong> akan dihapus.
          </p>
          {count === 0 ? (
            <p className="text-xs text-gray-500">Kategori ini kosong.</p>
          ) : (
            <p className="text-xs text-gray-500">
              {count} dokumen di dalamnya <strong className="font-medium text-gray-700">tidak ikut terhapus</strong>
              {orphanCount > 0
                ? `; ${orphanCount === count ? "semuanya" : `${orphanCount} di antaranya`} akan menjadi "tanpa kategori".`
                : " dan tetap ada di kategori lainnya."}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
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
          {deleting ? "Menghapus..." : "Hapus Kategori"}
        </button>
      </div>
    </Modal>
  );
}
