"use client";

import React, { useEffect, useRef } from "react";
import { FolderPlus, Plus, Search } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCategoryModal: () => void;
  onOpenUploadModal: () => void;
}

export default function TopHeader({
  searchQuery,
  onSearchChange,
  onOpenCategoryModal,
  onOpenUploadModal,
}: TopHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header
      style={{ viewTransitionName: "site-header", viewTransitionClass: "anchor" }}
      className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-200/70 px-4 sm:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 md:py-3.5">
      {/* Mobile: logo di atas, pencarian di bawahnya */}
      <div className="md:hidden mb-3">
        <BrandMark size="sm" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Cari dokumen…"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full pl-10 pr-4 md:pr-16 py-2 bg-gray-50/90 border border-gray-200/80 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition"
          />
          <div className="hidden md:flex items-center gap-1 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">
              K
            </kbd>
          </div>
        </div>

        {/* Tombol aksi hanya di desktop; di mobile ada di navigasi bawah. */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenCategoryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Kategori
          </button>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>
    </header>
  );
}
