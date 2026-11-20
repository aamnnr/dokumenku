import BrandMark from "@/components/ui/BrandMark";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Tombol aksi di kanan (mis. "Buat kategori"). */
  action?: React.ReactNode;
}

/** Header lengket untuk halaman selain Beranda (Favorit, Kategori, Akun). */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header
      style={{ viewTransitionName: "site-header", viewTransitionClass: "anchor" }}
      className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-200/70 px-4 sm:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 md:py-3.5"
    >
      <div className="md:hidden mb-3">
        <BrandMark size="sm" />
      </div>
      <div className="flex items-center justify-between gap-3 min-h-9">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

/** Area konten halaman dengan jarak aman dari navigasi bawah. */
export function PageBody({
  children,
  className = "",
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  /** "narrow" untuk halaman berupa daftar/pengaturan. */
  width?: "wide" | "narrow";
}) {
  return (
    <main
      className={`flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-8 sm:pt-8 md:pb-10 w-full mx-auto ${
        width === "narrow" ? "max-w-3xl" : "max-w-7xl"
      } ${className}`}
    >
      {children}
    </main>
  );
}
