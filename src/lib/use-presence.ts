"use client";

import { useEffect, useState } from "react";

/**
 * Menjaga elemen tetap ter-render selama animasi keluar berlangsung.
 *
 *   const mounted = usePresence(open, 200);
 *   if (!mounted) return null;
 *   return <div data-state={open ? "open" : "closed"} />;
 */
export function usePresence(open: boolean, exitMs = 200): boolean {
  const [mounted, setMounted] = useState(open);

  // Buka: render seketika (pola "menyesuaikan state saat props berubah").
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return mounted;
}
