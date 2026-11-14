import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callBackendPublic, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/backend";
import { clientAddress, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const acceptSchema = z.object({ token: z.string().regex(/^dti_[A-Za-z0-9_-]{20,100}$/), password: z.string().min(1).max(200), name: z.string().trim().max(200).optional() });
const answerSchema = z.object({ token: z.string().min(20) });
const sentence = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".") : text);

/**
 * Use a one-time link: the person chooses a password, the engine creates the account
 * (or sets the new password) and answers with a session, which is kept in the same
 * httpOnly cookie as any other sign-in. The session token never reaches page scripts.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  if (isRateLimited(`invite:${clientAddress(request.headers)}`)) return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a password." }, { status: 400 });
  const { token, password, name } = parsed.data;

  let answer: Response;
  try {
    answer = await callBackendPublic(`/api/auth/invitations/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(name ? { password, name } : { password }),
    });
  } catch {
    return NextResponse.json({ error: "The calling engine could not be reached. Try again in a moment." }, { status: 502 });
  }
  if (answer.status === 400 || answer.status === 404 || answer.status === 409) {
    const body = (await answer.json().catch(() => null)) as { detail?: unknown } | null;
    return NextResponse.json({ error: typeof body?.detail === "string" ? sentence(body.detail) : "This link could not be used." }, { status: answer.status });
  }
  const body = answerSchema.safeParse(await answer.json().catch(() => null));
  if (!answer.ok || !body.success) return NextResponse.json({ error: `The calling engine answered with an error (${answer.status}).` }, { status: 502 });

  (await cookies()).set(SESSION_COOKIE, body.data.token, sessionCookieOptions());
  return NextResponse.json({ ok: true });
}
