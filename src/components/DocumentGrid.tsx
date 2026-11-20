"use client";

import React, { useRef, useState, ViewTransition } from "react";
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  Globe,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import type { DocumentWithCategories } from "@/types";
import { formatBytes, formatRelativeDate, getFileKind, getFileLabel } from "@/lib/file-types";
import FileKindIcon, { FILE_KIND_STYLES } from "@/components/ui/FileKindIcon";
import Popover from "@/components/ui/Popover";

interface DocumentGridProps {
  documents: DocumentWithCategories[];
  /** Data sedang dimuat ulang di latar belakang (kartu tetap tampil). */
  refreshing: boolean;
  /** ID dokumen yang baru diunggah/diedit, disorot sebentar. */
  highlightId: string | null;
  hasActiveFilter: boolean;
  onResetFilters: () => void;
  onOpenUpload: () => void;
  onPreview: (document: DocumentWithCategories) => void;
  onOpenInDrive: (fileKey: string) => void;
  onEdit: (document: DocumentWithCategories) => void;
  onDelete: (document: DocumentWithCategories) => void;
  onShare: (document: DocumentWithCategories) => void;
}

export default function DocumentGrid({
  documents,
  refreshing,
  highlightId,
  hasActiveFilter,
  onResetFilters,
  onOpenUpload,
  onPreview,
  onOpenInDrive,
  onEdit,
  onDelete,
  onShare,
}: DocumentGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-gray-800">Dokumen</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {documents.length}
          </span>
        </div>
        {hasActiveFilter && (
          <button onClick={onResetFilters} className="text-xs text-gray-500 hover:text-gray-900 font-medium">
            Reset filter
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="motion-rise bg-white border border-gray-200/80 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {hasActiveFilter ? "Tidak ada dokumen yang cocok" : "Belum ada dokumen"}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {hasActiveFilter
              ? "Coba ubah kata kunci atau filter."
              : "Unggah dokumen pertama Anda. Kategori bisa ditambahkan kapan saja."}
          </p>
          {hasActiveFilter ? (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Reset filter
            </button>
          ) : (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Unggah Dokumen
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 transition-opacity duration-300 ${
            refreshing ? "opacity-70" : ""
          }`}
          aria-busy={refreshing}
        >
          {documents.map((doc) => (
            // ViewTransition: kartu masuk/keluar/pindah posisi dengan halus saat
            // folder, filter, urutan, atau data berubah (di dalam transition).
            <ViewTransition
              key={doc.id}
              name={`doc-${doc.id}`}
              enter="card-enter"
              exit="card-exit"
              update="card-move"
              default="none"
            >
              <DocumentCard
              highlight={doc.id === highlightId}
              doc={doc}
              onPreview={onPreview}
              onOpenInDrive={onOpenInDrive}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
              />
            </ViewTransition>
          ))}
        </div>
      )}
    </section>
  );
}

function DocumentCard({
  doc,
  highlight,
  onPreview,
  onOpenInDrive,
  onEdit,
  onDelete,
  onShare,
}: {
  doc: DocumentWithCategories;
  highlight: boolean;
  onPreview: (document: DocumentWithCategories) => void;
  onOpenInDrive: (fileKey: string) => void;
  onEdit: (document: DocumentWithCategories) => void;
  onDelete: (document: DocumentWithCategories) => void;
  onShare: (document: DocumentWithCategories) => void;
}) {
  const sharedCount = doc.share_emails.length;
  const kind = getFileKind(doc.mime_type, doc.title);
  const style = FILE_KIND_STYLES[kind];

  return (
    <article
      className={`group relative bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-[box-shadow,transform] duration-300 ease-[var(--ease-out)] flex flex-col ${
        highlight ? "motion-highlight" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onPreview(doc)}
        className={`h-24 rounded-t-2xl bg-gradient-to-br ${style.banner} relative overflow-hidden text-left`}
        aria-label={`Buka ${doc.title}`}
      >
        <FileKindIcon
          kind={kind}
          className="absolute -left-2 -bottom-5 w-24 h-24 text-white/50 transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1.5 group-hover:rotate-[-4deg]"
          strokeWidth={1.25}
        />
        <span className="absolute left-4 top-3 text-[10px] font-semibold tracking-wider text-gray-700/60">
          {getFileLabel(doc.title, doc.mime_type)}
        </span>
      </button>

      {/* Panel putih dengan "takik" untuk tombol menu, seperti referensi. */}
      <div className="bg-white -mt-4 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-between relative">
        <div className="absolute -top-4 right-3 bg-white rounded-t-2xl px-1.5 pt-1.5">
          <CardMenu
            downloadHref={`/api/documents/${doc.id}/download`}
            onPreview={() => onPreview(doc)}
            onOpenInDrive={() => onOpenInDrive(doc.file_key)}
            onShare={() => onShare(doc)}
            onEdit={() => onEdit(doc)}
            onDelete={() => onDelete(doc)}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1.5 pr-10">
            <span>{formatRelativeDate(doc.created_at)}</span>
            <span>•</span>
            <span>{formatBytes(doc.file_size)}</span>
            {(doc.share_public || sharedCount > 0) && (
              <button
                type="button"
                onClick={() => onShare(doc)}
                title={
                  doc.share_public
                    ? "Tautan publik aktif"
                    : `Dibagikan ke ${sharedCount} orang`
                }
                className={`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                  doc.share_public
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {doc.share_public ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {doc.share_public ? "Publik" : sharedCount}
              </button>
            )}
          </div>
          <h3 className="font-mono text-base font-semibold text-gray-900 truncate mb-3" title={doc.title}>
            {doc.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
          <div className="flex flex-wrap gap-1 overflow-hidden max-h-[22px]">
            {doc.categoryNames.length === 0 && (
              <span className="px-2 py-0.5 text-[10px] font-medium text-gray-400 border border-dashed border-gray-200 rounded-md">
                Tanpa kategori
              </span>
            )}
            {doc.categoryNames.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-md truncate max-w-[120px]"
              >
                {name}
              </span>
            ))}
          </div>
          <button
            onClick={() => onPreview(doc)}
            className="group/open text-xs font-medium text-gray-900 hover:text-indigo-600 shrink-0 transition-colors"
          >
            Buka <span className="inline-block transition-transform duration-200 group-hover/open:translate-x-0.5">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function CardMenu({
  downloadHref,
  onPreview,
  onOpenInDrive,
  onShare,
  onEdit,
  onDelete,
}: {
  downloadHref: string;
  onPreview: () => void;
  onOpenInDrive: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  const item = (label: string, Icon: typeof Pencil, action: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        action();
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg text-left transition-colors focus:outline-none ${
        danger
          ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50"
          : "text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu dokumen"
        className={`press w-8 h-7 rounded-full border bg-white flex items-center justify-center ${
          open ? "border-gray-400 text-gray-900" : "border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {/* Popover memilih sendiri: bawah, atas, atau samping agar tidak terpotong. */}
      <Popover open={open} onClose={close} anchorRef={triggerRef} align="end" role="menu" ariaLabel="Menu dokumen" className="w-52 sm:w-48 p-1">
        {item("Pratinjau", Eye, onPreview)}
        {item("Buka di Drive", ExternalLink, onOpenInDrive)}
        {item("Unduh", Download, () => {
          // Server mengarahkan ke tautan unduhan Google Drive.
          window.location.assign(downloadHref);
        })}
        {item("Bagikan…", Share2, onShare)}
        <div className="my-1 border-t border-gray-100" />
        {item("Edit nama & kategori", Pencil, onEdit)}
        <div className="my-1 border-t border-gray-100" />
        {item("Hapus", Trash2, onDelete, true)}
      </Popover>
    </>
  );
}
