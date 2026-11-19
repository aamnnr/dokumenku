/**
 * Logo Dokumenku: lembar dokumen indigo dengan tab ungu, tanpa latar.
 * Warna dipilih agar tetap terlihat di latar terang maupun gelap.
 * `variant="small"` memakai garis lebih sedikit & tebal agar terbaca di ≤ 32 px.
 */
export const LOGO_COLORS = {
  tab: "#8B88E6",
  page: "#4F46E5",
  lineStrong: "#FFFFFF",
  lineSoft: "rgba(255,255,255,0.6)",
} as const;

const TAB_PATH =
  "M12 22a7 7 0 0 1 7-7h20a7 7 0 0 1 5.6 2.8L49 24h32a7 7 0 0 1 7 7v55a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7z";

export function LogoGlyph({ variant = "full" }: { variant?: "full" | "small" }) {
  const c = LOGO_COLORS;
  return (
    <>
      <path d={TAB_PATH} fill={c.tab} />
      <rect x="12" y="32" width="76" height="61" rx="7" fill={c.page} />
      {variant === "small" ? (
        <>
          <rect x="24" y="50" width="38" height="10" rx="5" fill={c.lineStrong} />
          <rect x="24" y="68" width="48" height="10" rx="5" fill={c.lineSoft} />
        </>
      ) : (
        <>
          <rect x="24" y="46" width="34" height="7" rx="3.5" fill={c.lineStrong} />
          <rect x="24" y="60" width="46" height="7" rx="3.5" fill={c.lineSoft} />
          <rect x="24" y="74" width="26" height="7" rx="3.5" fill={c.lineSoft} />
        </>
      )}
    </>
  );
}

export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Dokumenku"
    >
      <LogoGlyph variant={size <= 40 ? "small" : "full"} />
    </svg>
  );
}
