import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/google-oauth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", getRequestOrigin(request)), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
