import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";
import FavoritesView from "@/components/views/FavoritesView";

export const metadata: Metadata = { title: "Favorit — Dokumenku" };

export default function Page() {
  return (
    <PageTransition>
      <FavoritesView />
    </PageTransition>
  );
}
