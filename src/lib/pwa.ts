"use client";

/**
 * Status instalasi PWA. Event `beforeinstallprompt` (Chrome/Edge/Android)
 * ditangkap sekali lalu disimpan agar tombol "Pasang aplikasi" bisa memakainya.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "available" | "ios" | "unsupported";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallState = "unsupported";
const listeners = new Set<() => void>();

function emit(next: InstallState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

let initialized = false;
export function initPwa() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (isStandalone()) {
    emit("installed");
  } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    // iOS tidak punya prompt instalasi; pengguna memakai Share → Add to Home Screen.
    emit("ios");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit("available");
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit("installed");
  });

  // Service worker hanya di produksi agar tidak mengganggu hot reload saat dev.
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Gagal mendaftarkan service worker:", error));
  }
}

export function subscribeInstallState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getInstallState = () => state;
export const getServerInstallState = (): InstallState => "unsupported";

export async function promptInstall() {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit(outcome === "accepted" ? "installed" : "unsupported");
}
