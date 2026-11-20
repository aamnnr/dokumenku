"use client";

import { useEffect, useId, useRef } from "react";
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

/** Jarak (px) atau kecepatan (px/ms) seret ke bawah yang menutup sheet. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;
/** Gerakan minimal sebelum dianggap menyeret (agar ketukan tetap jadi klik). */
const DRAG_SLOP = 6;

/**
 * Kerangka modal bersama. Desktop: dialog di tengah yang membesar halus.
 * Mobile: bottom sheet yang naik dari bawah dan bisa ditutup dengan menyeret
 * pegangan/judulnya ke bawah. Animasi keluar tetap diputar karena elemen
 * dipertahankan sebentar oleh usePresence.
 */
export default function Modal({ open, title, onClose, locked = false, children }: ModalProps) {
  const mounted = usePresence(open, 240);
  // Nama transisi unik per modal agar tetap di atas kartu saat View Transition.
  const transitionName = `modal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const state = open ? "open" : "closed";
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const dragged = useRef(false);

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

  // Bersihkan sisa offset seret setiap kali modal dibuka ulang.
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.style.removeProperty("translate");
    backdropRef.current?.style.removeProperty("opacity");
  }, [open]);

  if (!mounted) return null;

  // `translate` terpisah dari `transform` yang dipakai animasi masuk/keluar,
  // jadi offset seret tidak tertimpa dan sheet-out melanjutkan dari posisi jari.
  const setOffset = (y: number, animate: boolean) => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet) return;
    const transition = animate ? "translate 220ms var(--ease-out), opacity 220ms var(--ease-out)" : "none";
    sheet.style.transition = transition;
    sheet.style.translate = `0 ${y}px`;
    if (backdrop) {
      backdrop.style.transition = transition;
      backdrop.style.opacity = String(Math.max(0.2, 1 - y / (sheet.offsetHeight || 400)));
    }
  };

  const isSheetLayout = () => !window.matchMedia("(min-width: 640px)").matches;

  const onPointerDown = (event: React.PointerEvent) => {
    dragged.current = false;
    if (locked || !isSheetLayout() || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      active: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    if (!current.active) {
      if (Math.abs(dy) < DRAG_SLOP) return;
      if (dy < 0) {
        drag.current = null;
        return;
      }
      current.active = true;
      dragged.current = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    const dt = Math.max(1, event.timeStamp - current.lastTime);
    current.velocity = (event.clientY - current.lastY) / dt;
    current.lastY = event.clientY;
    current.lastTime = event.timeStamp;
    // Sedikit hambatan saat ditarik ke atas melewati posisi awal.
    setOffset(dy > 0 ? dy : dy / 4, false);
  };

  const endDrag = (event: React.PointerEvent) => {
    const current = drag.current;
    drag.current = null;
    if (!current?.active || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    if (dy > DISMISS_DISTANCE || current.velocity > DISMISS_VELOCITY) {
      onClose();
    } else {
      setOffset(0, true);
    }
  };

  // Klik setelah menyeret jangan sampai memicu tombol tutup.
  const onClickCapture = (event: React.MouseEvent) => {
    if (dragged.current) {
      dragged.current = false;
      event.stopPropagation();
    }
  };

  const dragHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  };

  return (
    <div
      className={`fixed inset-0 z-[66] flex items-end sm:items-center justify-center sm:p-4 ${
        open ? "" : "pointer-events-none"
      }`}
      style={{ viewTransitionName: transitionName, viewTransitionClass: "anchor" }}
    >
      <div
        ref={backdropRef}
        data-state={state}
        // Tanpa backdrop-blur: elemen ber-view-transition-name menjadi "backdrop
        // root" sehingga blur tidak bisa membaca halaman di belakangnya.
        className="motion-backdrop absolute inset-0 bg-black/45"
        onMouseDown={() => {
          if (!locked) onClose();
        }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-state={state}
        className="motion-dialog relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] flex flex-col"
      >
        {/* Area seret: pegangan + judul. touch-none agar browser tidak menggulir. */}
        <div {...dragHandlers} className="touch-none select-none sm:touch-auto sm:select-auto px-6 pt-6 sm:cursor-auto">
          <div className="sm:hidden -mt-3 pb-3 flex justify-center cursor-grab active:cursor-grabbing" aria-hidden>
            <div className={`h-1 w-10 rounded-full ${locked ? "bg-gray-100" : "bg-gray-300"}`} />
          </div>
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
        </div>
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
