"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  Globe,
  Loader2,
  Lock,
  Mail,
  Send,
  Share2,
  Smartphone,
  X,
} from "lucide-react";
import type { DocumentWithCategories } from "@/types";
import { SHARE_FILE_MAX_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/file-types";
import Modal from "@/components/ui/Modal";

interface ShareEmail {
  permissionId: string;
  email: string;
  expiresAt: string | null;
}
interface ShareState {
  public: boolean;
  link: string | null;
  emails: ShareEmail[];
}

interface ShareModalProps {
  open: boolean;
  document: DocumentWithCategories;
  onClose: () => void;
  /** Dipanggil setelah izin berubah agar lencana di kartu ikut diperbarui. */
  onChanged: () => void;
  showToast: (msg: string) => void;
}

const EXPIRY_OPTIONS = [
  { value: 0, label: "Tanpa batas" },
  { value: 1, label: "1 hari" },
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
];

// Kemampuan Web Share API dibaca di klien saja (aman untuk hidrasi).
const noopSubscribe = () => () => {};
const canShareLink = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const canShareFiles = () => {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] });
  } catch {
    return false;
  }
};

export default function ShareModal({ open, document, onClose, onChanged, showToast }: ShareModalProps) {
  const [share, setShare] = useState<ShareState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState(0);
  const [note, setNote] = useState("");

  const supportsLinkShare = useSyncExternalStore(noopSubscribe, canShareLink, () => false);
  const supportsFileShare = useSyncExternalStore(noopSubscribe, canShareFiles, () => false);
  const fileTooBig = document.file_size > SHARE_FILE_MAX_BYTES;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/documents/${document.id}/share`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) setShare(data.share);
        else setLoadError(data.error ?? "Gagal memuat status berbagi.");
      })
      .catch(() => !cancelled && setLoadError("Tidak dapat terhubung ke server."));
    return () => {
      cancelled = true;
    };
  }, [document.id]);

  const act = useCallback(
    async (label: string, body: Record<string, unknown>) => {
      setBusy(label);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${document.id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Gagal mengubah izin berbagi.");
          return false;
        }
        setShare(data.share);
        showToast(data.message);
        onChanged();
        return true;
      } catch {
        setError("Tidak dapat terhubung ke server.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [document.id, onChanged, showToast]
  );

  const copyLink = async () => {
    if (!share?.link) return;
    try {
      await navigator.clipboard.writeText(share.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Tidak bisa menyalin otomatis. Salin tautan secara manual.");
    }
  };

  const shareLink = async () => {
    if (!share?.link) return;
    try {
      await navigator.share({ title: document.title, text: document.title, url: share.link });
    } catch (shareError) {
      if ((shareError as DOMException)?.name !== "AbortError") setError("Gagal membuka lembar bagikan.");
    }
  };

  const shareFile = async () => {
    setBusy("file");
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/file`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengambil file.");
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], document.title, { type: document.mime_type || blob.type });
      if (!navigator.canShare?.({ files: [file] })) {
        setError("Perangkat ini tidak mendukung pengiriman jenis file ini.");
        return;
      }
      await navigator.share({ files: [file], title: document.title });
    } catch (shareError) {
      if ((shareError as DOMException)?.name !== "AbortError") setError("Gagal mengirim file.");
    } finally {
      setBusy(null);
    }
  };

  const addEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    const ok = await act("email", { action: "add-email", email, expiresInDays: expiry, message: note });
    if (ok) {
      setEmail("");
      setNote("");
    }
  };

  return (
    <Modal open={open} title="Bagikan" onClose={onClose} locked={busy !== null}>
      <p className="-mt-3 mb-5 text-xs text-gray-500 truncate" title={document.title}>
        {document.title}
      </p>

      {!share && !loadError && (
        <div className="space-y-3" aria-busy="true">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl" />
        </div>
      )}
      {loadError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{loadError}</p>
      )}

      {share && (
        <div className="space-y-5">
          {/* ---------- A. Tautan publik ---------- */}
          <section className="motion-rise rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  share.public ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                {share.public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Tautan publik</p>
                <p className="text-xs text-gray-500">
                  {share.public
                    ? "Siapa saja yang punya tautan bisa melihat & mengunduh."
                    : "Hanya Anda dan email di bawah yang bisa membuka."}
                </p>
              </div>
              <Switch
                checked={share.public}
                loading={busy === "public"}
                disabled={busy !== null}
                onChange={(next) => act("public", { action: next ? "public-on" : "public-off" })}
                label="Tautan publik"
              />
            </div>

            {share.public && share.link && (
              <div className="motion-rise mt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={share.link}
                    onFocus={(event) => event.target.select()}
                    className="flex-1 min-w-0 px-3 py-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl"
                    aria-label="Tautan berbagi"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`press shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border ${
                      copied
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 motion-star" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                {supportsLinkShare && (
                  <button
                    type="button"
                    onClick={shareLink}
                    className="press w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Bagikan tautan ke aplikasi…
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ---------- B. Email tertentu ---------- */}
          <section className="motion-rise rounded-2xl border border-gray-200 p-4" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Bagikan ke email</p>
                <p className="text-xs text-gray-500">Penerima perlu akun Google. Google mengirim notifikasi.</p>
              </div>
            </div>

            <form onSubmit={addEmail} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
                <select
                  value={expiry}
                  onChange={(event) => setExpiry(Number(event.target.value))}
                  className="shrink-0 px-2 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  aria-label="Masa berlaku akses"
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Pesan untuk penerima (opsional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={busy !== null || !email.trim()}
                className="press w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-40"
              >
                {busy === "email" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Kirim akses
              </button>
            </form>

            {share.emails.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {share.emails.map((entry, index) => (
                  <li
                    key={entry.permissionId}
                    className="motion-rise flex items-center gap-3 py-2.5"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {entry.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{entry.email}</p>
                      <p className="text-[11px] text-gray-400">
                        {entry.expiresAt
                          ? `Berakhir ${new Date(entry.expiresAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "Tanpa batas waktu"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => act(`remove-${entry.permissionId}`, { action: "remove-email", permissionId: entry.permissionId })}
                      disabled={busy !== null}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-colors"
                      aria-label={`Cabut akses ${entry.email}`}
                      title="Cabut akses"
                    >
                      {busy === `remove-${entry.permissionId}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- C. Kirim file langsung ---------- */}
          {supportsFileShare && (
            <section className="motion-rise rounded-2xl border border-gray-200 p-4" style={{ "--i": 2 } as React.CSSProperties}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Kirim file</p>
                  <p className="text-xs text-gray-500">
                    {fileTooBig
                      ? `Terlalu besar (${formatBytes(document.file_size)}). Maks. ${formatBytes(SHARE_FILE_MAX_BYTES)} — bagikan tautannya.`
                      : "Kirim file-nya langsung ke WhatsApp, Telegram, email, dll."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={shareFile}
                  disabled={fileTooBig || busy !== null}
                  className="press shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  {busy === "file" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                  Kirim
                </button>
              </div>
            </section>
          )}

          {error && (
            <p className="motion-rise text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  loading,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 disabled:opacity-60 ${
        checked ? "bg-indigo-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-300 ease-[var(--ease-spring)] ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {loading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
      </span>
    </button>
  );
}
