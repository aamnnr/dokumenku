import { NextResponse } from "next/server";

/** Balasan error JSON yang konsisten untuk seluruh route handler. */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Ambil pesan error yang aman untuk ditampilkan ke pengguna. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
