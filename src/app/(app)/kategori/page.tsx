import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";
import CategoriesView from "@/components/views/CategoriesView";

export const metadata: Metadata = { title: "Kategori — Dokumenku" };

export default function Page() {
  return (
    <PageTransition>
      <CategoriesView />
    </PageTransition>
  );
}
