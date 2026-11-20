"use client";

import { ChevronDown } from "lucide-react";
import { OptionList, useListbox, type SelectOption } from "@/components/ui/Select";

interface FilterPillProps<T extends string> {
  label: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
}

/**
 * Pill bergaya "Label: Nilai ⌄" seperti referensi, dengan daftar pilihan
 * kustom (bukan <select> bawaan) yang menyesuaikan posisi dengan layar.
 */
export default function FilterPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterPillProps<T>) {
  const listbox = useListbox({ value, options, onChange });
  const current = options.find((option) => option.value === value)?.label ?? "";

  return (
    <>
      <button
        {...listbox.triggerProps}
        aria-label={`${label}: ${current}`}
        className={`press inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs bg-white text-gray-500 border transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 ${
          listbox.open ? "border-gray-400" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span>{label}:</span>
        <strong className="font-medium text-gray-900 max-w-[120px] truncate">{current}</strong>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${listbox.open ? "rotate-180" : ""}`}
        />
      </button>
      <OptionList listbox={listbox} options={options} value={value} label={label} matchWidth={false} />
    </>
  );
}
