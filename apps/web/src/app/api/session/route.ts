import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callBackend, callBackendPublic, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/backend";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const signInSchema = z.union([
  z.object({ email: z.string().trim().min(3).max(254), password: z.string().min(1).max(200) }),
  z.object({ token: z.string().trim().min(8).max(400) }),
]);
const loginAnswer = z.object({ token: z.string().min(20) });

const UNREACHABLE = "The calling engine could not be reached. Check that it is running.";
const sentence = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".") : text);

/**
 * Sign in, as a person (email and password) or with the engine's own access token.
 * Either way the credential is checked by the calling engine, and what the browser
 * keeps is an httpOnly cookie that page scripts cannot read.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`signin:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }
  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password, or the engine's access token." }, { status: 400 });

  let session: string;
  if ("token" in parsed.data) {
    let check: Response;
    try {
      check = await callBackend("/api/auth/me", parsed.data.token, { signal: AbortSignal.timeout(10_000) });
    } catch {
      return NextResponse.json({ error: UNREACHABLE }, { status: 502 });
    }
    if (check.status === 401) return NextResponse.json({ error: "That access token was not accepted." }, { status: 401 });
    if (!check.ok) return NextResponse.json({ error: `The calling engine answered with an error (${check.status}).` }, { status: 502 });
    session = parsed.data.token;
  } else {
    let answer: Response;
    try {
      answer = await callBackendPublic("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    } catch {
      return NextResponse.json({ error: UNREACHABLE }, { status: 502 });
    }
    if (answer.status === 401 || answer.status === 422) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (answer.status === 429) {
      const body = (await answer.json().catch(() => null)) as { detail?: unknown } | null;
      return NextResponse.json({ error: typeof body?.detail === "string" ? sentence(body.detail) : "Too many failed attempts. Try again later." }, { status: 429 });
    }
    const body = loginAnswer.safeParse(await answer.json().catch(() => null));
    if (!answer.ok || !body.success) return NextResponse.json({ error: `The calling engine answered with an error (${answer.status}).` }, { status: 502 });
    session = body.data.token;
  }

  (await cookies()).set(SESSION_COOKIE, session, sessionCookieOptions());
  return NextResponse.json({ ok: true });
}

/** Sign out: the engine ends the session, then the cookie is removed. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await callBackend("/api/auth/logout", token, { method: "POST", signal: AbortSignal.timeout(5_000) }).catch(() => undefined);
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
