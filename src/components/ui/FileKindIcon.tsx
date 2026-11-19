import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  type LucideProps,
} from "lucide-react";
import type { FileKind } from "@/lib/file-types";

const ICONS: Record<FileKind, React.ComponentType<LucideProps>> = {
  pdf: FileText,
  image: FileImage,
  doc: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  archive: FileArchive,
  other: File,
};

/** Warna lembut per jenis file (dipakai untuk chip & banner). */
export const FILE_KIND_STYLES: Record<FileKind, { chip: string; banner: string }> = {
  pdf: { chip: "bg-rose-50 text-rose-600", banner: "from-[#F6D5DA] via-[#EBD3EC] to-[#D9D6F5]" },
  image: { chip: "bg-sky-50 text-sky-600", banner: "from-[#CFE6F7] via-[#D6DDF6] to-[#E5D7F2]" },
  doc: { chip: "bg-indigo-50 text-indigo-600", banner: "from-[#D8DAF7] via-[#DCD6F3] to-[#EAD7EE]" },
  sheet: { chip: "bg-emerald-50 text-emerald-600", banner: "from-[#CDEDE0] via-[#D3E9EC] to-[#D8E2F3]" },
  slide: { chip: "bg-amber-50 text-amber-600", banner: "from-[#F7E3C9] via-[#F3D9D2] to-[#EBD5E6]" },
  archive: { chip: "bg-stone-100 text-stone-600", banner: "from-[#E7E2DA] via-[#E3DFE2] to-[#DCDDE8]" },
  other: { chip: "bg-gray-100 text-gray-600", banner: "from-[#E4E6EB] via-[#E1E2EA] to-[#DDDDE8]" },
};

export default function FileKindIcon({ kind, ...props }: { kind: FileKind } & LucideProps) {
  const Icon = ICONS[kind];
  return <Icon {...props} />;
}
