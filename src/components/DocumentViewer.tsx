"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  Share2,
  TriangleAlert,
} from "lucide-react";
import type { DocumentWithCategories } from "@/types";
import { INLINE_PREVIEW_MAX_BYTES } from "@/lib/constants";
import { formatBytes, getFileKind, getFileLabel } from "@/lib/file-types";
import { usePresence } from "@/lib/use-presence";
import FileKindIcon, { FILE_KIND_STYLES } from "@/components/ui/FileKindIcon";

interface DocumentViewerProps {
  open: boolean;
  document: DocumentWithCategories;
  onClose: () => void;
  onOpenInDrive: (fileKey: string) => void;
  onShare: (document: DocumentWithCategories) => void;
}

type ViewMode = "pdf" | "image" | "text" | "video" | "audio" | "drive";

const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "log", "xml", "yml", "yaml"];

/**
 * Tentukan cara menampilkan file. File kecil dialirkan lewat server dan
 * dirender langsung (PDF via pdf.js, gambar, teks, media). Format lain atau
 * file yang melebihi batas respons server memakai penampil Google Drive.
 */
function getViewMode(document: DocumentWithCategories): ViewMode {
  if (document.file_size > INLINE_PREVIEW_MAX_BYTES) return "drive";
  const mime = document.mime_type.toLowerCase();
  const ext = document.title.includes(".") ? document.title.split(".").pop()!.toLowerCase() : "";
  const kind = getFileKind(document.mime_type, document.title);
  if (kind === "pdf") return "pdf";
  if (kind === "image" && !/heic|heif|tiff/.test(mime)) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/") || mime === "application/json" || TEXT_EXTENSIONS.includes(ext)) return "text";
  return "drive";
}

/**
 * Penampil dokumen layar penuh di dalam aplikasi. Tombol Kembali perangkat
 * (Android/PWA) menutup penampil, bukan meninggalkan halaman.
 */
export default function DocumentViewer({ open, document, onClose, onOpenInDrive, onShare }: DocumentViewerProps) {
  const mounted = usePresence(open, 240);
  const [forceDrive, setForceDrive] = useState(false);
  const mode = forceDrive ? "drive" : getViewMode(document);
  const fileUrl = `/api/documents/${document.id}/file`;
  const kind = getFileKind(document.mime_type, document.title);

  // Masukkan entri riwayat agar tombol Kembali menutup penampil.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ ...window.history.state, dokumenkuViewer: true }, "");
    const handlePop = () => onClose();
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [open, onClose]);

  const requestClose = useCallback(() => {
    if (window.history.state?.dokumenkuViewer) window.history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      // Dialog lain (mis. Bagikan) di atas penampil menangani Escape sendiri.
      if (event.key !== "Escape" || window.document.querySelector('.motion-dialog[data-state="open"]')) return;
      requestClose();
    };
    window.addEventListener("keydown", handleKey);
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.document.body.style.overflow = previous;
    };
  }, [open, requestClose]);

  if (!mounted) return null;

  const iconButton =
    "press w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 shrink-0";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${document.title}`}
      data-state={open ? "open" : "closed"}
      className="motion-viewer fixed inset-0 z-[65] flex flex-col bg-[#F4F4F5]"
      style={{ viewTransitionName: "viewer", viewTransitionClass: "anchor" }}
    >
      <header className="shrink-0 bg-white/95 backdrop-blur border-b border-gray-200/80 pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-2 sm:px-4 flex items-center gap-2">
          <button type="button" onClick={requestClose} className={iconButton} aria-label="Tutup pratinjau">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${FILE_KIND_STYLES[kind].chip}`}>
            <FileKindIcon kind={kind} className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold text-gray-900 truncate" title={document.title}>
              {document.title}
            </p>
            <p className="text-[11px] text-gray-400">
              {getFileLabel(document.title, document.mime_type)} · {formatBytes(document.file_size)}
            </p>
          </div>
          <button type="button" onClick={() => onShare(document)} className={iconButton} aria-label="Bagikan">
            <Share2 className="w-4 h-4" />
          </button>
          <a href={`/api/documents/${document.id}/download`} className={iconButton} aria-label="Unduh">
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onOpenInDrive(document.file_key)}
            className={`${iconButton} hidden sm:flex`}
            aria-label="Buka di Google Drive"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        {mode === "pdf" && <PdfView url={fileUrl} onFallback={() => setForceDrive(true)} />}
        {mode === "image" && <ImageView url={fileUrl} title={document.title} onFallback={() => setForceDrive(true)} />}
        {mode === "text" && <TextView url={fileUrl} onFallback={() => setForceDrive(true)} />}
        {mode === "video" && (
          <div className="h-full flex items-center justify-center p-4">
            <video src={fileUrl} controls playsInline className="max-h-full max-w-full rounded-xl bg-black" />
          </div>
        )}
        {mode === "audio" && (
          <div className="h-full flex items-center justify-center p-4">
            <audio src={fileUrl} controls className="w-full max-w-md" />
          </div>
        )}
        {mode === "drive" && (
          <DriveView
            fileKey={document.file_key}
            tooLarge={document.file_size > INLINE_PREVIEW_MAX_BYTES}
            onOpenInDrive={() => onOpenInDrive(document.file_key)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>;
}

function Loading({ label = "Memuat pratinjau…" }: { label?: string }) {
  return (
    <Centered>
      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      <p className="text-xs text-gray-500">{label}</p>
    </Centered>
  );
}

function Failed({ message, onFallback }: { message: string; onFallback: () => void }) {
  return (
    <Centered>
      <TriangleAlert className="w-7 h-7 text-amber-500" />
      <p className="text-sm text-gray-700 max-w-xs">{message}</p>
      <button
        type="button"
        onClick={onFallback}
        className="press px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
      >
        Coba penampil Google Drive
      </button>
    </Centered>
  );
}

async function fetchFile(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Gagal memuat file.");
  }
  return res;
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2, 3];

function ZoomBar({ zoom, setZoom, label }: { zoom: number; setZoom: (zoom: number) => void; label?: string }) {
  const index = ZOOM_STEPS.indexOf(zoom);
  return (
    <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-gray-900/90 text-white rounded-full shadow-lg">
      <button
        type="button"
        onClick={() => setZoom(ZOOM_STEPS[Math.max(0, index - 1)])}
        disabled={index <= 0}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
        aria-label="Perkecil"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setZoom(1)}
        className="min-w-14 px-2 h-8 rounded-full text-xs font-medium tabular-nums hover:bg-white/10"
        aria-label="Ukuran normal"
      >
        {label ?? `${Math.round(zoom * 100)}%`}
      </button>
      <button
        type="button"
        onClick={() => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, index + 1)])}
        disabled={index >= ZOOM_STEPS.length - 1}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
        aria-label="Perbesar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF: dirender ke <canvas> dengan pdf.js (Chrome Android tidak bisa
// menampilkan PDF di dalam iframe).

type PdfDocument = import("pdfjs-dist").PDFDocumentProxy;

function PdfView({ url, onFallback }: { url: string; onFallback: () => void }) {
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let task: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const res = await fetchFile(url, controller.signal);
        const data = new Uint8Array(await res.arrayBuffer());
        if (controller.signal.aborted) return;
        const loadingTask = pdfjs.getDocument({ data });
        task = loadingTask;
        const loaded = await loadingTask.promise;
        if (!controller.signal.aborted) setPdf(loaded);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error("PDF preview error:", loadError);
        setError(loadError instanceof Error && loadError.message ? loadError.message : "PDF tidak dapat ditampilkan.");
      }
    })();
    return () => {
      controller.abort();
      void task?.destroy();
    };
  }, [url]);

  // Lebar area untuk menyesuaikan halaman dengan layar.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Nomor halaman yang sedang terlihat.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !pdf) return;
    const handleScroll = () => {
      const pages = element.querySelectorAll<HTMLElement>("[data-page]");
      const middle = element.scrollTop + element.clientHeight / 3;
      let visible = 1;
      pages.forEach((page) => {
        if (page.offsetTop <= middle) visible = Number(page.dataset.page);
      });
      setCurrentPage(visible);
    };
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [pdf]);

  if (error) return <Failed message={error} onFallback={onFallback} />;

  const pageWidth = Math.max(200, Math.min(width - 24, 900) * zoom);

  return (
    <>
      <div ref={scrollRef} className="absolute inset-0 overflow-auto overscroll-contain">
        {!pdf || width === 0 ? (
          <Loading />
        ) : (
          <div className="py-4 pb-24 flex flex-col items-center gap-3" style={{ minWidth: pageWidth + 24 }}>
            {Array.from({ length: pdf.numPages }, (_, index) => (
              <PdfPage key={index} pdf={pdf} pageNumber={index + 1} width={pageWidth} root={scrollRef} />
            ))}
          </div>
        )}
      </div>
      {pdf && <ZoomBar zoom={zoom} setZoom={setZoom} label={`${currentPage} / ${pdf.numPages}`} />}
      {pdf && (
        <span className="sr-only" aria-live="polite">
          Halaman {currentPage} dari {pdf.numPages}, perbesaran {Math.round(zoom * 100)}%
        </span>
      )}
    </>
  );
}

/** Satu halaman PDF; baru dirender saat mendekati layar. */
function PdfPage({
  pdf,
  pageNumber,
  width,
  root,
}: {
  pdf: PdfDocument;
  pageNumber: number;
  width: number;
  root: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(pageNumber <= 2);
  const [ratio, setRatio] = useState(1.414);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { root: root.current, rootMargin: "600px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible, root]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvas, viewport });
      try {
        await task.promise;
        if (!cancelled) setRendered(true);
      } catch {
        // Render dibatalkan karena zoom/ukuran berubah.
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, width, visible]);

  return (
    <div
      ref={containerRef}
      data-page={pageNumber}
      className="relative bg-white shadow-sm rounded-sm overflow-hidden shrink-0"
      style={{ width, height: width * ratio }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" aria-label={`Halaman ${pageNumber}`} />
      {!rendered && <div className="absolute inset-0 skeleton" aria-hidden />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ImageView({ url, title, onFallback }: { url: string; title: string; onFallback: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  if (status === "error") return <Failed message="Gambar tidak dapat ditampilkan." onFallback={onFallback} />;

  return (
    <>
      <div className="absolute inset-0 overflow-auto overscroll-contain">
        <div
          className="min-h-full flex items-center justify-center p-4 pb-24"
          style={{ width: zoom > 1 ? `${zoom * 100}%` : undefined }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- file privat yang dialirkan server */}
          <img
            src={url}
            alt={title}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            onDoubleClick={() => setZoom((value) => (value === 1 ? 2 : 1))}
            className={`rounded-lg shadow-sm bg-white transition-opacity duration-300 ${
              status === "ready" ? "opacity-100" : "opacity-0"
            } ${zoom > 1 ? "max-w-none w-full" : "max-w-full max-h-[calc(100dvh-10rem)] object-contain"}`}
            style={zoom < 1 ? { transform: `scale(${zoom})` } : undefined}
          />
        </div>
      </div>
      {status === "loading" && <Loading />}
      {status === "ready" && <ZoomBar zoom={zoom} setZoom={setZoom} />}
    </>
  );
}

function TextView({ url, onFallback }: { url: string; onFallback: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFile(url, controller.signal)
      .then((res) => res.text())
      .then((value) => setText(value))
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Gagal memuat file.");
      });
    return () => controller.abort();
  }, [url]);

  if (error) return <Failed message={error} onFallback={onFallback} />;
  if (text === null) return <Loading />;

  return (
    <div className="absolute inset-0 overflow-auto overscroll-contain p-3 sm:p-6">
      <pre className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-4 text-xs leading-relaxed font-mono text-gray-800 whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}

function DriveView({
  fileKey,
  tooLarge,
  onOpenInDrive,
}: {
  fileKey: string;
  tooLarge: boolean;
  onOpenInDrive: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800">
        <span className="flex-1">
          {tooLarge
            ? `File di atas ${formatBytes(INLINE_PREVIEW_MAX_BYTES)} ditampilkan lewat Google Drive.`
            : "Format ini ditampilkan lewat Google Drive."}{" "}
          Perlu masuk ke akun Google pemilik.
        </span>
        <button type="button" onClick={onOpenInDrive} className="shrink-0 font-medium underline underline-offset-2">
          Buka di Drive
        </button>
      </div>
      <div className="relative flex-1">
        {!loaded && <Loading />}
        <iframe
          src={`https://drive.google.com/file/d/${encodeURIComponent(fileKey)}/preview`}
          title="Pratinjau Google Drive"
          onLoad={() => setLoaded(true)}
          allow="autoplay"
          className={`absolute inset-0 w-full h-full border-0 bg-white transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
