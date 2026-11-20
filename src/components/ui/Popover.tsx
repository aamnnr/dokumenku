"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "@/lib/use-presence";

export type Placement = "bottom" | "top" | "left" | "right";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Elemen pemicu; posisi panel dihitung dari kotak elemen ini. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Rata kiri (start) atau kanan (end) terhadap pemicu saat di atas/bawah. */
  align?: "start" | "end";
  /** Lebar panel minimal sama dengan pemicu (untuk dropdown pilihan). */
  matchWidth?: boolean;
  className?: string;
  role?: string;
  ariaLabel?: string;
  id?: string;
  children: React.ReactNode;
}

interface Position {
  top: number;
  left: number;
  placement: Placement;
  maxHeight?: number;
  minWidth?: number;
}

const GAP = 6;
const MARGIN = 8;

/**
 * Batas area yang aman ditempati panel: viewport (visual, agar tidak tertutup
 * keyboard di ponsel) dikurangi navigasi bawah bila sedang terlihat.
 */
function getBounds() {
  const viewport = window.visualViewport;
  const top = (viewport?.offsetTop ?? 0) + MARGIN;
  const left = MARGIN;
  const right = (viewport?.width ?? window.innerWidth) - MARGIN;
  let bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - MARGIN;

  const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
  if (nav) {
    const rect = nav.getBoundingClientRect();
    if (rect.height > 0 && getComputedStyle(nav).display !== "none") {
      bottom = Math.min(bottom, rect.top - MARGIN);
    }
  }
  return { top, left, right, bottom };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

/**
 * Pilih sisi yang muat: bawah → atas → samping (kiri/kanan). Bila tidak ada
 * yang muat penuh, pakai sisi vertikal yang paling lapang dan batasi tingginya
 * (panel bisa digulir).
 */
function computePosition(
  anchor: DOMRect,
  width: number,
  height: number,
  align: "start" | "end",
  matchWidth: boolean
): Position {
  const bounds = getBounds();
  const panelWidth = matchWidth ? Math.max(width, anchor.width) : width;
  const minWidth = matchWidth ? anchor.width : undefined;

  const horizontal = () =>
    clamp(
      align === "end" ? anchor.right - panelWidth : anchor.left,
      bounds.left,
      bounds.right - panelWidth
    );

  const spaceBelow = bounds.bottom - anchor.bottom - GAP;
  const spaceAbove = anchor.top - GAP - bounds.top;

  if (height <= spaceBelow) {
    return { top: anchor.bottom + GAP, left: horizontal(), placement: "bottom", minWidth };
  }
  if (height <= spaceAbove) {
    return { top: anchor.top - GAP - height, left: horizontal(), placement: "top", minWidth };
  }

  // Samping: hanya bila tinggi panel muat di area aman.
  const fitsVertically = height <= bounds.bottom - bounds.top;
  if (fitsVertically) {
    const top = clamp(anchor.top, bounds.top, bounds.bottom - height);
    const leftSide = anchor.left - GAP - panelWidth;
    const rightSide = anchor.right + GAP;
    const preferLeft = align === "end";
    const fitsLeft = leftSide >= bounds.left;
    const fitsRight = rightSide + panelWidth <= bounds.right;
    if ((preferLeft && fitsLeft) || (fitsLeft && !fitsRight)) {
      return { top, left: leftSide, placement: "left", minWidth };
    }
    if (fitsRight) {
      return { top, left: rightSide, placement: "right", minWidth };
    }
  }

  // Tidak ada yang muat penuh: sisi vertikal terlapang + tinggi dibatasi.
  if (spaceBelow >= spaceAbove) {
    return {
      top: anchor.bottom + GAP,
      left: horizontal(),
      placement: "bottom",
      maxHeight: Math.max(120, spaceBelow),
      minWidth,
    };
  }
  const maxHeight = Math.max(120, spaceAbove);
  return {
    top: anchor.top - GAP - Math.min(height, maxHeight),
    left: horizontal(),
    placement: "top",
    maxHeight,
    minWidth,
  };
}

const ORIGINS: Record<Placement, Record<"start" | "end", string>> = {
  bottom: { start: "top left", end: "top right" },
  top: { start: "bottom left", end: "bottom right" },
  left: { start: "top right", end: "top right" },
  right: { start: "top left", end: "top left" },
};

/**
 * Panel mengambang yang dirender di <body> (tidak terpotong overflow kartu
 * atau modal) dan menempatkan diri ke atas, bawah, atau samping pemicu
 * sesuai ruang yang tersedia. Posisi diperbarui saat gulir/ubah ukuran.
 */
export default function Popover({
  open,
  onClose,
  anchorRef,
  align = "start",
  matchWidth = false,
  className = "",
  role,
  ariaLabel,
  id,
  children,
}: PopoverProps) {
  const mounted = usePresence(open, 120);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    // Ukur tinggi alami (tanpa batas tinggi sebelumnya).
    const previousMax = panel.style.maxHeight;
    panel.style.maxHeight = "none";
    const { width, height } = panel.getBoundingClientRect();
    panel.style.maxHeight = previousMax;
    setPosition(computePosition(anchor.getBoundingClientRect(), width, height, align, matchWidth));
  }, [anchorRef, align, matchWidth]);

  // Lupakan posisi lama setelah tertutup, agar pembukaan berikutnya diukur ulang.
  if (!mounted && position) setPosition(null);

  // Hitung posisi sebelum digambar agar tidak berkedip di sudut layar.
  useLayoutEffect(() => {
    if (mounted && open) update();
  }, [mounted, open, update]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Jangan sampai Escape ikut menutup modal di belakangnya.
      event.stopPropagation();
      onClose();
      anchorRef.current?.focus();
    };
    const viewport = window.visualViewport;
    document.addEventListener("pointerdown", handlePointer, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      document.removeEventListener("pointerdown", handlePointer, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, [open, onClose, anchorRef, update]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      data-state={open ? "open" : "closed"}
      data-placement={position?.placement}
      className={`motion-pop fixed z-[80] overflow-y-auto overscroll-contain bg-white border border-gray-200 rounded-xl shadow-lg ${className}`}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        maxHeight: position?.maxHeight,
        minWidth: position?.minWidth,
        visibility: position ? "visible" : "hidden",
        transformOrigin: position ? ORIGINS[position.placement][align] : undefined,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
