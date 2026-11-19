"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

export default function CategoryModal({
  open,
  onClose,
  onSuccess,
  showToast,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description }),
      });
      const data = await res.json();

      if (res.ok) {
        setName("");
        setDescription("");
        onClose();
        showToast("Kategori berhasil ditambahkan!");
        onSuccess();
        return;
      }

      setError(data.error ?? "Gagal menambahkan kategori.");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Buat Kategori Baru" onClose={onClose} locked={submitting}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              placeholder="Misal: Berkas CPNS, Syarat BPJS"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Keterangan kumpulan berkas"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="press px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Kategori"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
