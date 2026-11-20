import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";
import FolderView from "@/components/views/FolderView";

export const metadata: Metadata = { title: "Folder — Dokumenku" };

/** Halaman satu folder kategori. Datanya dari layout (AppShell), id dibaca di klien. */
export default function Page() {
  return (
    <PageTransition>
      <FolderView />
    </PageTransition>
  );
}
