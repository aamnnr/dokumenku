"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import type { CategoryWithDocs, DocumentWithCategories } from "@/types";
import Modal from "@/components/ui/Modal";

interface EditDocumentModalProps {
  open: boolean;
  document: DocumentWithCategories;
  categories: CategoryWithDocs[];
  onClose: () => void;
  onSuccess: (documentId?: string) => void;
  showToast: (msg: string) => void;
}

export default function EditDocumentModal({
  open,
  document,
  categories,
  onClose,
  onSuccess,
  showToast,
}: EditDocumentModalProps) {
  const [title, setTitle] = useState(document.title);
  const [selected, setSelected] = useState<string[]>(document.categoryIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Nama dokumen wajib diisi.");
    if (selected.length === 0) return setError("Pilih minimal satu kategori.");

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), categoryIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Gagal menyimpan perubahan.");
      onClose();
      showToast(data.message);
      onSuccess(document.id);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Edit Dokumen" onClose={onClose} locked={saving}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama dokumen</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            autoFocus
          />
          <p className="text-[11px] text-gray-400 mt-1">Nama file di Google Drive ikut diganti.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Kategori</p>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
            {categories.map((category) => {
              const checked = selected.includes(category.id);
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => toggle(category.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50"
                  aria-pressed={checked}
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-white motion-star" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Satu file bisa masuk beberapa kategori tanpa disalin.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="press px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
