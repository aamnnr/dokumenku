import Logo from "@/components/ui/Logo";

export default function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size === "sm" ? 28 : 32} className="shrink-0" />
      <span className="font-bold text-lg tracking-tight text-gray-900">Dokumenku</span>
    </div>
  );
}
