"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import {
  getInstallState,
  getServerInstallState,
  promptInstall,
  subscribeInstallState,
} from "@/lib/pwa";

/** Tombol "Pasang aplikasi". Tersembunyi bila sudah terpasang/tidak didukung. */
export default function InstallAppButton({ className = "" }: { className?: string }) {
  const state = useSyncExternalStore(subscribeInstallState, getInstallState, getServerInstallState);
  const [showIosHint, setShowIosHint] = useState(false);

  if (state === "installed" || state === "unsupported") return null;

  if (state === "ios") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setShowIosHint((value) => !value)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 active:bg-gray-50"
        >
          <Download className="w-4 h-4 text-gray-400" />
          Pasang di layar utama
        </button>
        {showIosHint && (
          <p className="mx-3 mb-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
            Di Safari, ketuk <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <strong>Bagikan</strong>,
            lalu pilih <strong>Tambah ke Layar Utama</strong>.
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 active:bg-gray-50 hover:bg-gray-50 ${className}`}
    >
      <Download className="w-4 h-4 text-gray-400" />
      Pasang aplikasi
    </button>
  );
}
