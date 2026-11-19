import { Suspense, ViewTransition } from "react";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import PageTransition from "@/components/PageTransition";
import { getSession } from "@/lib/auth";
import { getCategoriesWithDocuments } from "@/lib/queries";

export default function Page() {
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
          <DashboardLoader />
        </ViewTransition>
      </Suspense>
    </PageTransition>
  );
}

async function DashboardLoader() {
  // Proxy sudah memblokir tamu; pengecekan diulang di dekat data.
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await getCategoriesWithDocuments();
  return <Dashboard categories={categories} userEmail={session.email} />;
}
