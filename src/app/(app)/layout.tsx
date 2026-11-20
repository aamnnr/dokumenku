import { Suspense, ViewTransition } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import PageTransition from "@/components/PageTransition";
import { getSession } from "@/lib/auth";
import { getLibrary } from "@/lib/queries";

/**
 * Layout bersama Beranda, Favorit, Kategori, dan Akun. Data pustaka dimuat
 * sekali di sini sehingga pindah tab tidak memuat ulang data; halaman hanya
 * merender isinya. Data runtime (cookie) dibungkus <Suspense> sesuai
 * aturan Cache Components.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PageTransition>
      <Suspense
        fallback={
          // Skeleton turun & memudar, lalu konten naik masuk.
          <ViewTransition exit="slide-down" default="none">
            <DashboardSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <AppLoader>{children}</AppLoader>
        </ViewTransition>
      </Suspense>
    </PageTransition>
  );
}

async function AppLoader({ children }: { children: React.ReactNode }) {
  // Proxy sudah memblokir tamu; pengecekan diulang di dekat data.
  const session = await getSession();
  if (!session) redirect("/login");

  const { categories, uncategorized } = await getLibrary();
  return (
    <AppShell categories={categories} uncategorized={uncategorized} userEmail={session.email}>
      {children}
    </AppShell>
  );
}
