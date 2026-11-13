import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callBackend, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/backend";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const signInSchema = z.object({ token: z.string().trim().min(8).max(400) });

/** Sign in: the access token is checked against the calling engine, then kept in an httpOnly cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`signin:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }
  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your access token." }, { status: 400 });

  let check: Response;
  try {
    check = await callBackend("/api/campaigns", parsed.data.token, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return NextResponse.json({ error: "The calling engine could not be reached. Check that it is running." }, { status: 502 });
  }
  if (check.status === 401) return NextResponse.json({ error: "That access token was not accepted." }, { status: 401 });
  if (!check.ok) return NextResponse.json({ error: `The calling engine answered with an error (${check.status}).` }, { status: 502 });

  (await cookies()).set(SESSION_COOKIE, parsed.data.token, sessionCookieOptions());
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
