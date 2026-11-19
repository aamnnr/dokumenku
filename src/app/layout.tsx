import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dokumenku — Manajemen Dokumen",
  applicationName: "Dokumenku",
  appleWebApp: { capable: true, title: "Dokumenku", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  description:
    "Kelola dokumen dan kategorinya tanpa duplikasi file. Metadata di Supabase, berkas di Google Drive.",
};

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: ekstensi browser (mis. ColorZilla, Grammarly)
    // sering menyisipkan atribut ke <html>/<body> sebelum React hidrasi.
    // Hanya berlaku untuk atribut elemen ini, bukan anak-anaknya.
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
