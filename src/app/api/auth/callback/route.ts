import { NextResponse, type NextRequest } from "next/server";
import { createOAuthClient, getLoginRedirectUri, getRequestOrigin } from "@/lib/google-oauth";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isOwnerEmail,
  sessionCookieOptions,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const params = request.nextUrl.searchParams;

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };

  if (params.get("error")) return fail("cancelled");

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("state");
  }

  try {
    const client = createOAuthClient(getLoginRedirectUri(origin));
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return fail("google");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email || !payload?.email_verified || !isOwnerEmail(email)) {
      return fail("forbidden");
    }

    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(email),
      sessionCookieOptions(SESSION_MAX_AGE)
    );
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return fail("google");
  }
}
