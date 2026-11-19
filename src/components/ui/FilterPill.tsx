import { ChevronDown } from "lucide-react";

interface FilterPillProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/**
 * Pill bergaya "Label: Nilai ⌄" seperti referensi. Memakai <select> asli yang
 * transparan di atas pill agar tetap aksesibel dan nyaman di ponsel.
 */
export default function FilterPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterPillProps<T>) {
  const current = options.find((option) => option.value === value)?.label ?? "";

  return (
    <label className="relative inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full text-xs bg-white text-gray-500 border border-gray-200 hover:border-gray-300 focus-within:ring-2 focus-within:ring-gray-200 transition shrink-0 cursor-pointer">
      <span>{label}:</span>
      <strong className="font-medium text-gray-900 max-w-[120px] truncate">{current}</strong>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
