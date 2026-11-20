import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";
import HomeView from "@/components/views/HomeView";

export const metadata: Metadata = { title: "Dokumenku — Manajemen Dokumen" };

export default function Page() {
  return (
    <PageTransition>
      <HomeView />
    </PageTransition>
  );
}
