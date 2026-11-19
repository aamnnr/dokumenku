import { NextResponse } from "next/server";
import { createOAuthClient, getLoginRedirectUri, getRequestOrigin } from "@/lib/google-oauth";
import { OAUTH_STATE_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);

  try {
    const state = crypto.randomUUID();
    const client = createOAuthClient(getLoginRedirectUri(origin));
    const authUrl = client.generateAuthUrl({
      scope: ["openid", "email"],
      state,
      prompt: "select_account",
      login_hint: process.env.OWNER_EMAIL?.split(",")[0]?.trim() || undefined,
    });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, state, sessionCookieOptions(60 * 10));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }
}
