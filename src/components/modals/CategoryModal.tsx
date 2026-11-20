"use client";

import React, { useState } from "react";
import type { CategoryWithDocs } from "@/types";
import Modal from "@/components/ui/Modal";

interface CategoryModalProps {
  open: boolean;
  /** Diisi untuk mode ganti nama; kosong untuk membuat kategori baru. */
  category?: Pick<CategoryWithDocs, "id" | "name" | "description"> | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400";

export default function CategoryModal({ open, category, onClose, onSuccess, showToast }: CategoryModalProps) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError("Nama kategori wajib diisi.");

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(category ? `/api/categories/${category.id}` : "/api/categories", {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();

      if (res.ok) {
        onClose();
        showToast(category ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan!");
        onSuccess();
        return;
      }

      setError(data.error ?? "Gagal menyimpan kategori.");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Ubah Kategori" : "Buat Kategori Baru"}
      onClose={onClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Kategori</label>
          <input
            type="text"
            placeholder="Misal: Berkas CPNS, Syarat BPJS"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Deskripsi Singkat <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            placeholder="Keterangan kumpulan berkas"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="press px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Kategori"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
