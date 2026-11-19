"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { usePresence } from "@/lib/use-presence";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Cegah menutup modal (mis. saat unggahan berjalan). */
  locked?: boolean;
  children: React.ReactNode;
}

/**
 * Kerangka modal bersama. Desktop: dialog di tengah yang membesar halus.
 * Mobile: bottom sheet yang naik dari bawah. Animasi keluar tetap diputar
 * karena elemen dipertahankan sebentar oleh usePresence.
 */
export default function Modal({ open, title, onClose, locked = false, children }: ModalProps) {
  const mounted = usePresence(open, 240);
  // Nama transisi unik per modal agar tetap di atas kartu saat View Transition.
  const transitionName = `modal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const state = open ? "open" : "closed";

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Kunci scroll halaman di belakang modal.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [open, locked, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 ${
        open ? "" : "pointer-events-none"
      }`}
      style={{ viewTransitionName: transitionName, viewTransitionClass: "anchor" }}
    >
      <div
        data-state={state}
        // Tanpa backdrop-blur: elemen ber-view-transition-name menjadi "backdrop
        // root" sehingga blur tidak bisa membaca halaman di belakangnya.
        className="motion-backdrop absolute inset-0 bg-black/45"
        onMouseDown={() => {
          if (!locked) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-state={state}
        className="motion-dialog relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Pegangan bottom sheet (mobile) */}
        <div className="sm:hidden mx-auto -mt-3 mb-3 h-1 w-10 rounded-full bg-gray-200" aria-hidden />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg disabled:opacity-40 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
