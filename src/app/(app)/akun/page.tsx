import type { Metadata } from "next";
import PageTransition from "@/components/PageTransition";
import AccountView from "@/components/views/AccountView";

export const metadata: Metadata = { title: "Akun — Dokumenku" };

export default function Page() {
  return (
    <PageTransition>
      <AccountView />
    </PageTransition>
  );
}
