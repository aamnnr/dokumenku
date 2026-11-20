"use client";

import { useSyncExternalStore } from "react";
import { FAVORITES_STORAGE_KEY } from "@/lib/constants";

/**
 * Kategori favorit disimpan di localStorage dan dibaca lewat
 * useSyncExternalStore agar aman untuk hidrasi (server selalu kosong).
 */
const EMPTY: string[] = [];

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

let snapshot: string[] = typeof window === "undefined" ? EMPTY : read();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(next: string[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage tidak tersedia: favorit hanya berlaku di sesi ini.
  }
  listeners.forEach((listener) => listener());
}

export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}

export function toggleFavorite(categoryId: string) {
  write(snapshot.includes(categoryId) ? snapshot.filter((id) => id !== categoryId) : [...snapshot, categoryId]);
}

export function removeFavorite(categoryId: string) {
  if (snapshot.includes(categoryId)) write(snapshot.filter((id) => id !== categoryId));
}
