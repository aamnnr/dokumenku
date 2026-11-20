"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Popover from "@/components/ui/Popover";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Teks kecil di bawah label (opsional). */
  hint?: string;
}

interface UseListboxArgs<T extends string> {
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
}

/**
 * Logika dropdown bersama: buka/tutup, opsi aktif, dan keyboard
 * (↑/↓/Home/End/Enter/Spasi/Tab) mengikuti pola listbox WAI-ARIA.
 */
export function useListbox<T extends string>({ value, options, onChange }: UseListboxArgs<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const show = useCallback(() => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }, [selectedIndex]);
  const close = useCallback(() => setOpen(false), []);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index >= last ? 0 : index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? last : index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const triggerProps = {
    ref: triggerRef,
    type: "button" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": open ? listId : undefined,
    "aria-activedescendant": open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined,
    onClick: () => (open ? close() : show()),
    onKeyDown: onTriggerKeyDown,
  };

  return { open, close, triggerRef, triggerProps, listId, activeIndex, setActiveIndex, choose };
}

/** Panel opsi untuk useListbox. */
export function OptionList<T extends string>({
  listbox,
  options,
  value,
  align = "start",
  matchWidth = true,
  label,
}: {
  listbox: ReturnType<typeof useListbox<T>>;
  options: Array<SelectOption<T>>;
  value: T;
  align?: "start" | "end";
  matchWidth?: boolean;
  label: string;
}) {
  return (
    <Popover
      open={listbox.open}
      onClose={listbox.close}
      anchorRef={listbox.triggerRef}
      align={align}
      matchWidth={matchWidth}
      role="listbox"
      ariaLabel={label}
      id={listbox.listId}
      className="p-1 min-w-44 max-w-[min(20rem,calc(100vw-1rem))]"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const active = index === listbox.activeIndex;
        return (
          <div
            key={option.value}
            id={`${listbox.listId}-${index}`}
            role="option"
            aria-selected={selected}
            // Jangan curi fokus dari pemicu (keyboard tetap di sana).
            onPointerDown={(event) => event.preventDefault()}
            onPointerEnter={() => listbox.setActiveIndex(index)}
            onClick={() => listbox.choose(index)}
            className={`flex items-center gap-2.5 px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg cursor-pointer select-none transition-colors ${
              active ? "bg-gray-100" : ""
            } ${selected ? "font-medium text-gray-900" : "text-gray-700"}`}
          >
            <span className="flex-1 min-w-0">
              <span className="block truncate">{option.label}</span>
              {option.hint && <span className="block text-[11px] font-normal text-gray-400 truncate">{option.hint}</span>}
            </span>
            <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? "text-gray-900" : "invisible"}`} />
          </div>
        );
      })}
    </Popover>
  );
}

interface SelectProps<T extends string> {
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
  size?: "md" | "sm";
  className?: string;
  align?: "start" | "end";
}

/** Pengganti <select> bawaan browser, bergaya sama dengan input aplikasi. */
export default function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  size = "md",
  className = "",
  align = "start",
}: SelectProps<T>) {
  const listbox = useListbox({ value, options, onChange });
  const current = options.find((option) => option.value === value);

  return (
    <>
      <button
        {...listbox.triggerProps}
        aria-label={label}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 border bg-white text-left transition focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50 ${
          listbox.open ? "border-gray-400" : "border-gray-200 hover:border-gray-300"
        } ${size === "sm" ? "px-2.5 py-2 text-xs rounded-xl" : "w-full px-3.5 py-2.5 text-sm rounded-xl"} ${className}`}
      >
        <span className={`truncate ${current ? "text-gray-900" : "text-gray-400"}`}>
          {current?.label ?? "Pilih…"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${listbox.open ? "rotate-180" : ""}`}
        />
      </button>
      <OptionList listbox={listbox} options={options} value={value} label={label} align={align} />
    </>
  );
}
